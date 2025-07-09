import { JournalEntry, JournalMedia, VoiceTranscription, Prisma } from '@prisma/client'

let journalIdCounter = 1
let mediaIdCounter = 1
let transcriptionIdCounter = 1

export const createMockJournalEntry = (
  userId: string,
  overrides?: Partial<JournalEntry>
): JournalEntry => ({
  id: `journal-${journalIdCounter++}`,
  userId,
  tripId: null,
  locationId: null,
  title: `Journal Entry ${journalIdCounter}`,
  content: 'Today was an amazing day exploring the city...',
  entryType: 'general',
  weatherData: { temp: 25, condition: 'sunny' },
  sharedWith: [],
  privacyLevel: 'private',
  coordinates: [0, 0],
  address: 'Test Location',
  timezone: 'UTC',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockJournalMedia = (
  entryId: string,
  overrides?: Partial<JournalMedia>
): JournalMedia => ({
  id: `media-${mediaIdCounter++}`,
  entryId,
  mediaType: 'photo',
  filePath: `https://example.com/photo-${mediaIdCounter}.jpg`,
  thumbnailPath: `https://example.com/photo-${mediaIdCounter}-thumb.jpg`,
  caption: 'Test photo caption',
  exifData: {
    width: 1920,
    height: 1080,
  },
  originalFilename: `photo-${mediaIdCounter}.jpg`,
  fileSize: BigInt(1024000),
  mimeType: 'image/jpeg',
  altText: 'Test photo',
  orderIndex: mediaIdCounter,
  createdAt: new Date(),
  ...overrides,
})

export const createMockVoiceTranscription = (
  entryId: string,
  overrides?: Partial<VoiceTranscription>
): VoiceTranscription => ({
  id: `transcription-${transcriptionIdCounter++}`,
  entryId,
  audioFilePath: `https://example.com/audio-${transcriptionIdCounter}.mp3`,
  transcriptionText: 'This is a test transcription of the voice note.',
  language: 'en',
  confidenceScore: new Prisma.Decimal(0.95),
  processingStatus: 'completed',
  createdAt: new Date(),
  ...overrides,
})