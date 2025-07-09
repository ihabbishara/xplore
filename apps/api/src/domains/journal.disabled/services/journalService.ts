import { PrismaClient, JournalEntry, JournalMedia, Prisma } from '@prisma/client'
import { 
  JournalEntryCreateInput, 
  JournalEntryUpdateInput,
  JournalSearchFilters,
  NearbySearchParams,
  MediaFile,
  JournalMediaInput
} from '../types/journal.types'
import { MediaProcessorService } from './mediaProcessorService'
import { VoiceTranscriptionService } from './voiceTranscriptionService'
import { LocationIntelligenceService } from './locationIntelligenceService'
import { redis } from '../../../lib/redis'

export class JournalService {
  constructor(
    private prisma: PrismaClient,
    private mediaProcessor: MediaProcessorService,
    private voiceService: VoiceTranscriptionService,
    private locationService: LocationIntelligenceService
  ) {}

  async createEntry(userId: string, input: JournalEntryCreateInput): Promise<JournalEntry> {
    // Enrich location data if coordinates provided
    let enrichedData: any = {}
    if (input.coordinates) {
      const locationData = await this.locationService.enrichLocation(input.coordinates)
      enrichedData = {
        address: input.address || locationData.address,
        timezone: input.timezone || locationData.timezone,
        weatherData: locationData.weather
      }
      
      // Auto-suggest tags if not provided
      if (!input.tags || input.tags.length === 0) {
        input.tags = await this.locationService.suggestTags(locationData, input.content)
      }
    }
    
    const entry = await this.prisma.journalEntry.create({
      data: {
        ...input,
        ...enrichedData,
        userId,
        coordinates: input.coordinates ? input.coordinates as any : undefined
      },
      include: {
        location: true,
        trip: true,
        media: true,
        _count: {
          select: {
            media: true,
            voiceTranscriptions: true
          }
        }
      }
    })
    
    // Invalidate cache
    await this.invalidateUserCache(userId)
    
    return entry
  }

  async updateEntry(
    entryId: string, 
    userId: string, 
    input: JournalEntryUpdateInput
  ): Promise<JournalEntry> {
    // Verify ownership
    const existing = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, userId }
    })
    
    if (!existing) {
      throw new Error('Journal entry not found')
    }
    
    const updated = await this.prisma.journalEntry.update({
      where: { id: entryId },
      data: input,
      include: {
        location: true,
        trip: true,
        media: true,
        _count: {
          select: {
            media: true,
            voiceTranscriptions: true
          }
        }
      }
    })
    
    await this.invalidateUserCache(userId)
    
    return updated
  }

  async deleteEntry(entryId: string, userId: string): Promise<void> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, userId }
    })
    
    if (!entry) {
      throw new Error('Journal entry not found')
    }
    
    // Delete associated media files from storage
    const media = await this.prisma.journalMedia.findMany({
      where: { entryId }
    })
    
    // TODO: Delete files from S3/storage
    
    await this.prisma.journalEntry.delete({
      where: { id: entryId }
    })
    
    await this.invalidateUserCache(userId)
  }

  async getEntry(entryId: string, userId: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: {
        id: entryId,
        OR: [
          { userId },
          { privacyLevel: 'public' },
          { 
            AND: [
              { privacyLevel: 'friends' },
              { sharedWith: { has: userId } }
            ]
          }
        ]
      },
      include: {
        location: true,
        trip: true,
        media: {
          orderBy: { orderIndex: 'asc' }
        },
        voiceTranscriptions: true,
        user: {
          include: {
            profile: true
          }
        }
      }
    })
    
    return entry
  }

  async listEntries(filters: JournalSearchFilters): Promise<{
    entries: JournalEntry[]
    total: number
    hasMore: boolean
  }> {
    const where: Prisma.JournalEntryWhereInput = {}
    
    if (filters.userId) where.userId = filters.userId
    if (filters.tripId) where.tripId = filters.tripId
    if (filters.entryType) where.entryType = filters.entryType
    if (filters.mood) where.mood = filters.mood
    if (filters.privacyLevel) where.privacyLevel = filters.privacyLevel
    
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo })
      }
    }
    
    if (filters.hasMedia) {
      where.media = { some: {} }
    }
    
    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { content: { contains: filters.searchQuery, mode: 'insensitive' } },
        { tags: { has: filters.searchQuery.toLowerCase() } }
      ]
    }
    
    const limit = filters.limit || 20
    const offset = filters.offset || 0
    
    const [entries, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: {
          location: true,
          trip: true,
          media: {
            orderBy: { orderIndex: 'asc' },
            take: 3 // Only first 3 media items for list view
          },
          user: {
            include: {
              profile: true
            }
          },
          _count: {
            select: {
              media: true,
              voiceTranscriptions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.journalEntry.count({ where })
    ])
    
    return {
      entries,
      total,
      hasMore: offset + entries.length < total
    }
  }

  async searchNearby(params: NearbySearchParams): Promise<JournalEntry[]> {
    // Convert radius to degrees (rough approximation)
    const latDelta = params.radiusKm / 111
    const lngDelta = params.radiusKm / (111 * Math.cos(params.lat * Math.PI / 180))
    
    const entries = await this.prisma.$queryRaw<JournalEntry[]>`
      SELECT je.*, 
        ST_Distance(
          ST_MakePoint(${params.lng}::float, ${params.lat}::float)::geography,
          ST_MakePoint((je.coordinates->>'lng')::float, (je.coordinates->>'lat')::float)::geography
        ) / 1000 as distance_km
      FROM journal_entries je
      WHERE je.coordinates IS NOT NULL
        AND (je.coordinates->>'lat')::float BETWEEN ${params.lat - latDelta} AND ${params.lat + latDelta}
        AND (je.coordinates->>'lng')::float BETWEEN ${params.lng - lngDelta} AND ${params.lng + lngDelta}
        AND ST_DWithin(
          ST_MakePoint(${params.lng}::float, ${params.lat}::float)::geography,
          ST_MakePoint((je.coordinates->>'lng')::float, (je.coordinates->>'lat')::float)::geography,
          ${params.radiusKm * 1000}
        )
        ${params.userId ? Prisma.sql`AND (je.user_id = ${params.userId} OR je.privacy_level = 'public')` : Prisma.sql`AND je.privacy_level = 'public'`}
      ORDER BY distance_km ASC
      LIMIT ${params.limit || 20}
    `
    
    return entries
  }

  async addMedia(
    entryId: string,
    userId: string,
    file: MediaFile,
    metadata: JournalMediaInput
  ): Promise<JournalMedia> {
    // Verify ownership
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, userId }
    })
    
    if (!entry) {
      throw new Error('Journal entry not found')
    }
    
    // Process media based on type
    let processedMedia
    if (metadata.mediaType === 'photo') {
      processedMedia = await this.mediaProcessor.processPhoto(file)
    } else if (metadata.mediaType === 'audio') {
      processedMedia = await this.mediaProcessor.processAudio(file)
    } else if (metadata.mediaType === 'video') {
      processedMedia = await this.mediaProcessor.processVideo(file)
    } else {
      throw new Error('Unsupported media type')
    }
    
    // Create media record
    const media = await this.prisma.journalMedia.create({
      data: {
        entryId,
        mediaType: metadata.mediaType,
        originalFilename: metadata.originalFilename || file.originalname,
        filePath: processedMedia.filePath,
        thumbnailPath: processedMedia.thumbnailPath,
        fileSize: BigInt(processedMedia.fileSize),
        mimeType: processedMedia.mimeType,
        durationSeconds: processedMedia.durationSeconds,
        exifData: processedMedia.metadata?.exifData,
        altText: metadata.altText,
        caption: metadata.caption,
        orderIndex: metadata.orderIndex || 0,
        processingStatus: 'processed'
      }
    })
    
    // Generate alt text for accessibility if not provided
    if (metadata.mediaType === 'photo' && !metadata.altText) {
      const publicUrl = this.mediaProcessor.getPublicUrl(processedMedia.filePath)
      const altText = await this.mediaProcessor.generateAltText(publicUrl)
      
      await this.prisma.journalMedia.update({
        where: { id: media.id },
        data: { altText }
      })
    }
    
    // Start transcription for audio
    if (metadata.mediaType === 'audio') {
      this.startAudioTranscription(media.id, processedMedia.filePath)
    }
    
    return media
  }

  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const media = await this.prisma.journalMedia.findFirst({
      where: {
        id: mediaId,
        entry: { userId }
      }
    })
    
    if (!media) {
      throw new Error('Media not found')
    }
    
    // TODO: Delete files from S3/storage
    
    await this.prisma.journalMedia.delete({
      where: { id: mediaId }
    })
  }

  async shareEntry(entryId: string, userId: string, shareWith: string[]): Promise<void> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, userId }
    })
    
    if (!entry) {
      throw new Error('Journal entry not found')
    }
    
    await this.prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        privacyLevel: 'friends',
        sharedWith: shareWith
      }
    })
  }

  async updatePrivacy(
    entryId: string,
    userId: string,
    privacyLevel: 'private' | 'friends' | 'public'
  ): Promise<void> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, userId }
    })
    
    if (!entry) {
      throw new Error('Journal entry not found')
    }
    
    await this.prisma.journalEntry.update({
      where: { id: entryId },
      data: { privacyLevel }
    })
  }

  private async startAudioTranscription(mediaId: string, audioFilePath: string): Promise<void> {
    try {
      // Get the media entry to find the journal entry
      const media = await this.prisma.journalMedia.findUnique({
        where: { id: mediaId },
        include: { entry: true }
      })
      
      if (!media) return
      
      // Create transcription record
      const transcription = await this.prisma.voiceTranscription.create({
        data: {
          entryId: media.entryId,
          audioFilePath,
          processingStatus: 'processing'
        }
      })
      
      // Start async transcription
      this.voiceService.transcribeAudio({ audioFilePath })
        .then(async (result) => {
          await this.prisma.voiceTranscription.update({
            where: { id: transcription.id },
            data: {
              transcriptionText: result.text,
              confidenceScore: result.confidence,
              language: result.language,
              processingStatus: 'completed'
            }
          })
          
          // Also update the media record
          await this.prisma.journalMedia.update({
            where: { id: mediaId },
            data: { transcription: result.text }
          })
        })
        .catch(async (error) => {
          console.error('Transcription error:', error)
          await this.prisma.voiceTranscription.update({
            where: { id: transcription.id },
            data: { processingStatus: 'failed' }
          })
        })
    } catch (error) {
      console.error('Failed to start transcription:', error)
    }
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    const keys = await redis.keys(`journal:*:${userId}`)
    if (keys.length > 0) {
      await redis.del(keys)
    }
  }
}