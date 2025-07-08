import { Request, Response } from 'express'
import { JournalService } from '../services/journalService'
import { MediaProcessorService } from '../services/mediaProcessorService'
import { VoiceTranscriptionService } from '../services/voiceTranscriptionService'
import { LocationIntelligenceService } from '../services/locationIntelligenceService'
import { OfflineSyncService } from '../services/offlineSyncService'
import { prisma } from '../../../lib/prisma'
import { body, param, query, validationResult } from 'express-validator'
import multer from 'multer'

// Initialize services
const mediaProcessor = new MediaProcessorService()
const voiceService = new VoiceTranscriptionService()
const locationService = new LocationIntelligenceService()
const journalService = new JournalService(prisma, mediaProcessor, voiceService, locationService)
const offlineSyncService = new OfflineSyncService(prisma, journalService)

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/webm',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

export class JournalController {
  static createValidation = [
    body('content').notEmpty().withMessage('Content is required'),
    body('title').optional().isString(),
    body('entryType').optional().isIn(['general', 'food', 'accommodation', 'activity']),
    body('tripId').optional().isUUID(),
    body('locationId').optional().isUUID(),
    body('coordinates').optional().isObject(),
    body('coordinates.lat').optional().isFloat({ min: -90, max: 90 }),
    body('coordinates.lng').optional().isFloat({ min: -180, max: 180 }),
    body('tags').optional().isArray(),
    body('mood').optional().isInt({ min: 1, max: 5 }),
    body('privacyLevel').optional().isIn(['private', 'friends', 'public'])
  ]

  static async createEntry(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const entry = await journalService.createEntry(userId, req.body)

      res.status(201).json({
        data: entry,
        message: 'Journal entry created successfully'
      })
    } catch (error) {
      console.error('Create journal entry error:', error)
      res.status(500).json({
        error: 'Failed to create journal entry'
      })
    }
  }

  static updateValidation = [
    param('entryId').isUUID(),
    body('title').optional().isString(),
    body('content').optional().isString(),
    body('entryType').optional().isIn(['general', 'food', 'accommodation', 'activity']),
    body('tags').optional().isArray(),
    body('mood').optional().isInt({ min: 1, max: 5 }),
    body('isFavorite').optional().isBoolean(),
    body('privacyLevel').optional().isIn(['private', 'friends', 'public'])
  ]

  static async updateEntry(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { entryId } = req.params
      const userId = req.user!.userId
      const entry = await journalService.updateEntry(entryId, userId, req.body)

      res.json({
        data: entry,
        message: 'Journal entry updated successfully'
      })
    } catch (error: any) {
      console.error('Update journal entry error:', error)
      if (error.message === 'Journal entry not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to update journal entry'
      })
    }
  }

  static async deleteEntry(req: Request, res: Response) {
    try {
      const { entryId } = req.params
      const userId = req.user!.userId
      await journalService.deleteEntry(entryId, userId)

      res.json({
        message: 'Journal entry deleted successfully'
      })
    } catch (error: any) {
      console.error('Delete journal entry error:', error)
      if (error.message === 'Journal entry not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to delete journal entry'
      })
    }
  }

  static async getEntry(req: Request, res: Response) {
    try {
      const { entryId } = req.params
      const userId = req.user!.userId
      const entry = await journalService.getEntry(entryId, userId)

      if (!entry) {
        return res.status(404).json({ error: 'Journal entry not found' })
      }

      res.json({ data: entry })
    } catch (error) {
      console.error('Get journal entry error:', error)
      res.status(500).json({
        error: 'Failed to get journal entry'
      })
    }
  }

  static listValidation = [
    query('tripId').optional().isUUID(),
    query('entryType').optional().isIn(['general', 'food', 'accommodation', 'activity']),
    query('tags').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('mood').optional().isInt({ min: 1, max: 5 }),
    query('hasMedia').optional().isBoolean(),
    query('searchQuery').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ]

  static async listEntries(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const filters = {
        userId,
        tripId: req.query.tripId as string,
        entryType: req.query.entryType as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        mood: req.query.mood ? parseInt(req.query.mood as string) : undefined,
        hasMedia: req.query.hasMedia === 'true',
        searchQuery: req.query.searchQuery as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      }

      const result = await journalService.listEntries(filters)

      res.json({
        data: result.entries,
        meta: {
          total: result.total,
          hasMore: result.hasMore,
          limit: filters.limit,
          offset: filters.offset
        }
      })
    } catch (error) {
      console.error('List journal entries error:', error)
      res.status(500).json({
        error: 'Failed to list journal entries'
      })
    }
  }

  static async uploadMedia(req: Request, res: Response) {
    try {
      const { entryId } = req.params
      const userId = req.user!.userId
      const file = req.file

      if (!file) {
        return res.status(400).json({ error: 'No file provided' })
      }

      const mediaType = file.mimetype.startsWith('image/') ? 'photo' :
                       file.mimetype.startsWith('audio/') ? 'audio' :
                       file.mimetype.startsWith('video/') ? 'video' : 'document'

      const media = await journalService.addMedia(
        entryId,
        userId,
        {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        },
        {
          mediaType: mediaType as any,
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          caption: req.body.caption,
          altText: req.body.altText,
          orderIndex: req.body.orderIndex ? parseInt(req.body.orderIndex) : undefined
        }
      )

      res.status(201).json({
        data: media,
        message: 'Media uploaded successfully'
      })
    } catch (error: any) {
      console.error('Upload media error:', error)
      if (error.message === 'Journal entry not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to upload media'
      })
    }
  }

  static async deleteMedia(req: Request, res: Response) {
    try {
      const { mediaId } = req.params
      const userId = req.user!.userId
      await journalService.deleteMedia(mediaId, userId)

      res.json({
        message: 'Media deleted successfully'
      })
    } catch (error: any) {
      console.error('Delete media error:', error)
      if (error.message === 'Media not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to delete media'
      })
    }
  }

  static async getEntryMedia(req: Request, res: Response) {
    try {
      const { entryId } = req.params
      const userId = req.user!.userId
      
      const entry = await journalService.getEntry(entryId, userId)
      if (!entry) {
        return res.status(404).json({ error: 'Journal entry not found' })
      }

      res.json({
        data: entry.media,
        meta: {
          total: entry.media.length
        }
      })
    } catch (error) {
      console.error('Get entry media error:', error)
      res.status(500).json({
        error: 'Failed to get entry media'
      })
    }
  }

  static transcribeValidation = [
    body('audioFilePath').notEmpty().withMessage('Audio file path is required'),
    body('language').optional().isString()
  ]

  static async transcribeVoice(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const result = await voiceService.transcribeAudio(req.body)

      res.json({
        data: result,
        message: 'Transcription completed'
      })
    } catch (error) {
      console.error('Voice transcription error:', error)
      res.status(500).json({
        error: 'Failed to transcribe audio'
      })
    }
  }

  static async getTranscriptionStatus(req: Request, res: Response) {
    try {
      const { transcriptionId } = req.params
      
      const transcription = await prisma.voiceTranscription.findUnique({
        where: { id: transcriptionId }
      })

      if (!transcription) {
        return res.status(404).json({ error: 'Transcription not found' })
      }

      res.json({ data: transcription })
    } catch (error) {
      console.error('Get transcription status error:', error)
      res.status(500).json({
        error: 'Failed to get transcription status'
      })
    }
  }

  static searchValidation = [
    query('q').notEmpty().withMessage('Search query is required'),
    query('filters').optional().isJSON()
  ]

  static async searchEntries(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const searchQuery = req.query.q as string
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {}

      const result = await journalService.listEntries({
        userId,
        searchQuery,
        ...filters
      })

      res.json({
        data: result.entries,
        meta: {
          total: result.total,
          query: searchQuery
        }
      })
    } catch (error) {
      console.error('Search entries error:', error)
      res.status(500).json({
        error: 'Failed to search journal entries'
      })
    }
  }

  static nearbyValidation = [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    query('radius').optional().isFloat({ min: 0.1, max: 100 })
  ]

  static async searchNearby(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user!.userId
      const params = {
        lat: parseFloat(req.query.lat as string),
        lng: parseFloat(req.query.lng as string),
        radiusKm: req.query.radius ? parseFloat(req.query.radius as string) : 10,
        userId,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      }

      const entries = await journalService.searchNearby(params)

      res.json({
        data: entries,
        meta: {
          center: { lat: params.lat, lng: params.lng },
          radius: params.radiusKm
        }
      })
    } catch (error) {
      console.error('Search nearby error:', error)
      res.status(500).json({
        error: 'Failed to search nearby entries'
      })
    }
  }

  static shareValidation = [
    param('entryId').isUUID(),
    body('shareWith').isArray().withMessage('shareWith must be an array of user IDs')
  ]

  static async shareEntry(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { entryId } = req.params
      const userId = req.user!.userId
      await journalService.shareEntry(entryId, userId, req.body.shareWith)

      res.json({
        message: 'Journal entry shared successfully'
      })
    } catch (error: any) {
      console.error('Share entry error:', error)
      if (error.message === 'Journal entry not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to share journal entry'
      })
    }
  }

  static privacyValidation = [
    param('entryId').isUUID(),
    body('privacyLevel').isIn(['private', 'friends', 'public']).withMessage('Invalid privacy level')
  ]

  static async updatePrivacy(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { entryId } = req.params
      const userId = req.user!.userId
      await journalService.updatePrivacy(entryId, userId, req.body.privacyLevel)

      res.json({
        message: 'Privacy settings updated successfully'
      })
    } catch (error: any) {
      console.error('Update privacy error:', error)
      if (error.message === 'Journal entry not found') {
        return res.status(404).json({ error: error.message })
      }
      res.status(500).json({
        error: 'Failed to update privacy settings'
      })
    }
  }

  static async syncOffline(req: Request, res: Response) {
    try {
      const userId = req.user!.userId
      const result = await offlineSyncService.syncOfflineEntries(userId, req.body)

      res.json({
        data: result,
        message: 'Offline sync completed'
      })
    } catch (error) {
      console.error('Offline sync error:', error)
      res.status(500).json({
        error: 'Failed to sync offline entries'
      })
    }
  }

  static async getConflicts(req: Request, res: Response) {
    try {
      const userId = req.user!.userId
      const conflicts = await offlineSyncService.getConflicts(userId)

      res.json({
        data: conflicts,
        meta: {
          total: conflicts.length
        }
      })
    } catch (error) {
      console.error('Get conflicts error:', error)
      res.status(500).json({
        error: 'Failed to get sync conflicts'
      })
    }
  }

  static resolveConflictValidation = [
    param('entryId').isUUID(),
    body('resolution').isIn(['local', 'server', 'merge']),
    body('mergedData').optional().isObject()
  ]

  static async resolveConflict(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { entryId } = req.params
      const userId = req.user!.userId
      await offlineSyncService.resolveConflict(
        userId,
        entryId,
        req.body.resolution,
        req.body.mergedData
      )

      res.json({
        message: 'Conflict resolved successfully'
      })
    } catch (error) {
      console.error('Resolve conflict error:', error)
      res.status(500).json({
        error: 'Failed to resolve conflict'
      })
    }
  }

  static upload = upload.single('file')
}