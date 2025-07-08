import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe'
import OpenAI from 'openai'
import { TranscriptionResult, VoiceTranscriptionInput } from '../types/journal.types'

export class VoiceTranscriptionService {
  private transcribeClient: TranscribeClient
  private openai: OpenAI | null
  
  constructor() {
    // AWS Transcribe setup
    this.transcribeClient = new TranscribeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    })
    
    // OpenAI Whisper setup (alternative)
    this.openai = process.env.OPENAI_API_KEY 
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null
  }

  async transcribeAudio(input: VoiceTranscriptionInput): Promise<TranscriptionResult> {
    // Prefer OpenAI Whisper if available
    if (this.openai) {
      return this.transcribeWithWhisper(input)
    }
    
    // Fallback to AWS Transcribe
    return this.transcribeWithAWS(input)
  }

  private async transcribeWithWhisper(input: VoiceTranscriptionInput): Promise<TranscriptionResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized')
      }

      // For Whisper, we need to download the file first or use a stream
      // This is a simplified version - in production, you'd handle this better
      const response = await fetch(input.audioFilePath)
      const audioFile = await response.blob()
      
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile as any, // Type conversion needed
        model: 'whisper-1',
        language: input.language || 'en',
        response_format: 'verbose_json'
      })
      
      return {
        text: transcription.text,
        confidence: 0.95, // Whisper doesn't provide confidence scores
        language: transcription.language || input.language || 'en'
      }
    } catch (error) {
      console.error('Whisper transcription error:', error)
      throw new Error('Failed to transcribe with Whisper')
    }
  }

  private async transcribeWithAWS(input: VoiceTranscriptionInput): Promise<TranscriptionResult> {
    try {
      const jobName = `journal-transcription-${Date.now()}`
      
      // Start transcription job
      const startCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: this.mapLanguageCode(input.language || 'en') as any,
        MediaFormat: this.getMediaFormat(input.audioFilePath) as any,
        Media: {
          MediaFileUri: input.audioFilePath
        },
        OutputBucketName: process.env.S3_BUCKET_NAME,
        Settings: {
          ShowAlternatives: true,
          MaxAlternatives: 3
        }
      })
      
      await this.transcribeClient.send(startCommand)
      
      // Poll for completion
      const result = await this.pollTranscriptionJob(jobName)
      
      return {
        text: result.text,
        confidence: result.confidence,
        language: input.language || 'en'
      }
    } catch (error) {
      console.error('AWS Transcribe error:', error)
      throw new Error('Failed to transcribe with AWS')
    }
  }

  private async pollTranscriptionJob(jobName: string): Promise<{ text: string; confidence: number }> {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0
    
    while (attempts < maxAttempts) {
      const getCommand = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      })
      
      const response = await this.transcribeClient.send(getCommand)
      const job = response.TranscriptionJob
      
      if (job?.TranscriptionJobStatus === 'COMPLETED') {
        // Fetch and parse the transcript
        const transcriptUri = job.Transcript?.TranscriptFileUri
        if (!transcriptUri) {
          throw new Error('No transcript URI found')
        }
        
        const transcriptResponse = await fetch(transcriptUri)
        const transcriptData = await transcriptResponse.json()
        
        return {
          text: (transcriptData as any).results.transcripts[0].transcript,
          confidence: this.calculateAverageConfidence((transcriptData as any).results.items)
        }
      } else if (job?.TranscriptionJobStatus === 'FAILED') {
        throw new Error(`Transcription job failed: ${job.FailureReason}`)
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
    }
    
    throw new Error('Transcription job timed out')
  }

  async detectLanguage(audioBuffer: Buffer): Promise<string> {
    // Simple language detection
    // In production, you'd use a proper language detection service
    if (this.openai) {
      try {
        const transcription = await this.openai.audio.transcriptions.create({
          file: new File([audioBuffer], 'audio.wav'),
          model: 'whisper-1',
          response_format: 'verbose_json'
        })
        
        return transcription.language || 'en'
      } catch (error) {
        console.error('Language detection error:', error)
      }
    }
    
    return 'en' // Default to English
  }

  private mapLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-US',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN'
    }
    
    return languageMap[language] || 'en-US'
  }

  private getMediaFormat(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase()
    
    const formatMap: Record<string, string> = {
      'mp3': 'mp3',
      'mp4': 'mp4',
      'wav': 'wav',
      'flac': 'flac',
      'ogg': 'ogg',
      'webm': 'webm',
      'm4a': 'mp4'
    }
    
    return formatMap[ext || ''] || 'mp3'
  }

  private calculateAverageConfidence(items: any[]): number {
    if (!items || items.length === 0) return 0
    
    const confidences = items
      .filter(item => item.alternatives && item.alternatives[0])
      .map(item => parseFloat(item.alternatives[0].confidence))
      .filter(conf => !isNaN(conf))
    
    if (confidences.length === 0) return 0
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
  }
}