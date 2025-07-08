import { Router } from 'express'
import { JournalController } from '../controllers/journalController'
import { authenticate } from '../../auth/middleware/authMiddleware'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Journal entry CRUD operations
router.post('/entries', JournalController.createValidation, JournalController.createEntry)
router.put('/entries/:entryId', JournalController.updateValidation, JournalController.updateEntry)
router.delete('/entries/:entryId', JournalController.deleteEntry)
router.get('/entries/:entryId', JournalController.getEntry)
router.get('/entries', JournalController.listValidation, JournalController.listEntries)

// Media management
router.post('/entries/:entryId/media', JournalController.upload, JournalController.uploadMedia)
router.delete('/media/:mediaId', JournalController.deleteMedia)
router.get('/entries/:entryId/media', JournalController.getEntryMedia)

// Voice transcription
router.post('/transcribe', JournalController.transcribeValidation, JournalController.transcribeVoice)
router.get('/transcriptions/:transcriptionId', JournalController.getTranscriptionStatus)

// Search and discovery
router.get('/search', JournalController.searchValidation, JournalController.searchEntries)
router.get('/nearby', JournalController.nearbyValidation, JournalController.searchNearby)

// Privacy and sharing
router.post('/entries/:entryId/share', JournalController.shareValidation, JournalController.shareEntry)
router.put('/entries/:entryId/privacy', JournalController.privacyValidation, JournalController.updatePrivacy)

// Offline sync
router.post('/sync', JournalController.syncOffline)
router.get('/sync/conflicts', JournalController.getConflicts)
router.post('/sync/conflicts/:entryId/resolve', JournalController.resolveConflictValidation, JournalController.resolveConflict)

export default router