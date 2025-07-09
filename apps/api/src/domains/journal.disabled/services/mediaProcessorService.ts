import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import exifr from 'exifr'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { MediaFile, ProcessedMedia } from '../types/journal.types'

export class MediaProcessorService {
  private s3Client: S3Client
  private bucketName: string
  
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    })
    this.bucketName = process.env.S3_BUCKET_NAME || 'xplore-media'
  }

  async processPhoto(file: MediaFile): Promise<ProcessedMedia> {
    try {
      // Extract EXIF data
      const exifData = await this.extractExifData(file.buffer)
      
      // Generate unique filenames
      const fileId = uuidv4()
      const ext = path.extname(file.originalname)
      const originalPath = `journal/photos/${fileId}/original${ext}`
      const thumbnailPath = `journal/photos/${fileId}/thumbnail${ext}`
      
      // Create thumbnail
      const thumbnail = await sharp(file.buffer)
        .resize(400, 400, {
          fit: 'cover',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toBuffer()
      
      // Optimize original image
      const optimized = await sharp(file.buffer)
        .resize(2048, 2048, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 90 })
        .toBuffer()
      
      // Upload to S3
      await Promise.all([
        this.uploadToS3(originalPath, optimized, file.mimetype),
        this.uploadToS3(thumbnailPath, thumbnail, 'image/jpeg')
      ])
      
      // Get image metadata
      const metadata = await sharp(file.buffer).metadata()
      
      return {
        filePath: originalPath,
        thumbnailPath,
        fileSize: optimized.length,
        mimeType: file.mimetype,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          exifData
        }
      }
    } catch (error) {
      console.error('Photo processing error:', error)
      throw new Error('Failed to process photo')
    }
  }

  async processAudio(file: MediaFile): Promise<ProcessedMedia> {
    try {
      const fileId = uuidv4()
      const ext = path.extname(file.originalname)
      const filePath = `journal/audio/${fileId}/original${ext}`
      
      // For now, just upload the original audio
      // In production, you might want to compress or convert formats
      await this.uploadToS3(filePath, file.buffer, file.mimetype)
      
      // TODO: Get audio duration using ffmpeg or similar
      const durationSeconds = 0 // Placeholder
      
      return {
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        durationSeconds,
        metadata: {
          originalName: file.originalname
        }
      }
    } catch (error) {
      console.error('Audio processing error:', error)
      throw new Error('Failed to process audio')
    }
  }

  async processVideo(file: MediaFile): Promise<ProcessedMedia> {
    try {
      const fileId = uuidv4()
      const ext = path.extname(file.originalname)
      const filePath = `journal/videos/${fileId}/original${ext}`
      const thumbnailPath = `journal/videos/${fileId}/thumbnail.jpg`
      
      // Upload original video
      await this.uploadToS3(filePath, file.buffer, file.mimetype)
      
      // TODO: Generate video thumbnail using ffmpeg
      // TODO: Get video duration
      
      return {
        filePath,
        thumbnailPath,
        fileSize: file.size,
        mimeType: file.mimetype,
        durationSeconds: 0, // Placeholder
        metadata: {
          originalName: file.originalname
        }
      }
    } catch (error) {
      console.error('Video processing error:', error)
      throw new Error('Failed to process video')
    }
  }

  async generateAltText(imageUrl: string): Promise<string> {
    // TODO: Integrate with AI service (OpenAI Vision, AWS Rekognition, etc.)
    // For now, return a placeholder
    return 'Image description pending'
  }

  private async extractExifData(buffer: Buffer): Promise<any> {
    try {
      const exif = await exifr.parse(buffer, {
        gps: true,
        xmp: true,
        iptc: true
      })
      
      if (!exif) return null
      
      return {
        make: exif.Make,
        model: exif.Model,
        dateTime: exif.DateTimeOriginal || exif.DateTime,
        gps: exif.latitude && exif.longitude ? {
          latitude: exif.latitude,
          longitude: exif.longitude,
          altitude: exif.altitude
        } : null,
        exposureTime: exif.ExposureTime,
        fNumber: exif.FNumber,
        iso: exif.ISO,
        focalLength: exif.FocalLength,
        lensModel: exif.LensModel
      }
    } catch (error) {
      console.error('EXIF extraction error:', error)
      return null
    }
  }

  private async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
    
    await this.s3Client.send(command)
  }

  getPublicUrl(filePath: string): string {
    // If using CloudFront
    if (process.env.CLOUDFRONT_URL) {
      return `${process.env.CLOUDFRONT_URL}/${filePath}`
    }
    
    // Direct S3 URL
    return `https://${this.bucketName}.s3.amazonaws.com/${filePath}`
  }
}