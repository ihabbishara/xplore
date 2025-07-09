import { Router } from 'express'
import { JournalController } from '../controllers/journalController'
import { authenticate } from '../../auth/middleware/authMiddleware'
import { validate } from '../../../middleware/validation'
import { createRateLimiter } from '../../../shared/middleware/rateLimiter'
import {
  createJournalEntryValidation,
  updateJournalEntryValidation,
  journalEntryIdValidation,
  journalQueryValidation,
  addMediaValidation,
  voiceTranscriptionValidation
} from '../validations/journal.validation'

const router = Router()

// Rate limiter for journal operations
const journalLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes
  message: 'Too many journal operations. Please try again later.',
})

// Rate limiter for media uploads
const mediaLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  message: 'Too many media uploads. Please try again later.',
})

// All routes require authentication
router.use(authenticate)

// Journal entry CRUD operations
router.post('/entries', journalLimiter, validate(createJournalEntryValidation), JournalController.createEntry)
router.put('/entries/:entryId', journalLimiter, validate(journalEntryIdValidation), validate(updateJournalEntryValidation), JournalController.updateEntry)
router.delete('/entries/:entryId', journalLimiter, validate(journalEntryIdValidation), JournalController.deleteEntry)
router.get('/entries/:entryId', validate(journalEntryIdValidation), JournalController.getEntry)
router.get('/entries', validate(journalQueryValidation), JournalController.listEntries)

// Media management
router.post('/entries/:entryId/media', mediaLimiter, validate(journalEntryIdValidation), validate(addMediaValidation), JournalController.upload, JournalController.uploadMedia)
router.delete('/media/:mediaId', journalLimiter, JournalController.deleteMedia)
router.get('/entries/:entryId/media', validate(journalEntryIdValidation), JournalController.getEntryMedia)

// Voice transcription
router.post('/transcribe', mediaLimiter, validate(voiceTranscriptionValidation), JournalController.transcribeVoice)
router.get('/transcriptions/:transcriptionId', JournalController.getTranscriptionStatus)

// Search and discovery
router.get('/search', JournalController.searchEntries)
router.get('/nearby', JournalController.searchNearby)

// Privacy and sharing
router.post('/entries/:entryId/share', journalLimiter, validate(journalEntryIdValidation), JournalController.shareEntry)
router.put('/entries/:entryId/privacy', journalLimiter, validate(journalEntryIdValidation), JournalController.updatePrivacy)

// Offline sync
router.post('/sync', journalLimiter, JournalController.syncOffline)
router.get('/sync/conflicts', JournalController.getConflicts)
router.post('/sync/conflicts/:entryId/resolve', journalLimiter, validate(journalEntryIdValidation), JournalController.resolveConflict)

export default router