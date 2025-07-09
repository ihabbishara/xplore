import { JournalEntry, JournalMedia, VoiceTranscription } from '@prisma/client'

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
  mood: 'happy',
  weather: { temp: 25, condition: 'sunny' },
  tags: ['travel', 'adventure'],
  isPrivate: false,
  coordinates: [0, 0],
  locationName: 'Test Location',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockJournalMedia = (
  journalEntryId: string,
  overrides?: Partial<JournalMedia>
): JournalMedia => ({
  id: `media-${mediaIdCounter++}`,
  journalEntryId,
  type: 'photo',
  url: `https://example.com/photo-${mediaIdCounter}.jpg`,
  thumbnailUrl: `https://example.com/photo-${mediaIdCounter}-thumb.jpg`,
  caption: 'Test photo caption',
  metadata: {
    width: 1920,
    height: 1080,
    size: 1024000,
    mimeType: 'image/jpeg',
  },
  order: mediaIdCounter,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockVoiceTranscription = (
  journalEntryId: string,
  overrides?: Partial<VoiceTranscription>
): VoiceTranscription => ({
  id: `transcription-${transcriptionIdCounter++}`,
  journalEntryId,
  audioUrl: `https://example.com/audio-${transcriptionIdCounter}.mp3`,
  transcription: 'This is a test transcription of the voice note.',
  duration: 30,
  language: 'en',
  confidence: 0.95,
  provider: 'whisper',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})