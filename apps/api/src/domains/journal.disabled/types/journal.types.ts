export interface JournalEntryCreateInput {
  title?: string
  content: string
  entryType?: 'general' | 'food' | 'accommodation' | 'activity'
  tripId?: string
  locationId?: string
  coordinates?: {
    lat: number
    lng: number
  }
  address?: string
  timezone?: string
  tags?: string[]
  mood?: number
  privacyLevel?: 'private' | 'friends' | 'public'
  sharedWith?: string[]
  localId?: string
}

export interface JournalEntryUpdateInput {
  title?: string
  content?: string
  entryType?: 'general' | 'food' | 'accommodation' | 'activity'
  tags?: string[]
  mood?: number
  isFavorite?: boolean
  privacyLevel?: 'private' | 'friends' | 'public'
  sharedWith?: string[]
}

export interface JournalMediaInput {
  mediaType: 'photo' | 'video' | 'audio' | 'document'
  originalFilename?: string
  mimeType?: string
  caption?: string
  altText?: string
  orderIndex?: number
}

export interface MediaFile {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}

export interface ProcessedMedia {
  filePath: string
  thumbnailPath?: string
  fileSize: number
  mimeType: string
  metadata?: any
  durationSeconds?: number
}

export interface VoiceTranscriptionInput {
  audioFilePath: string
  language?: string
}

export interface TranscriptionResult {
  text: string
  confidence: number
  language: string
}

export interface LocationEnrichment {
  coordinates: { lat: number; lng: number }
  address: string
  timezone: string
  weather?: any
  nearbyPOIs?: any[]
}

export interface JournalSearchFilters {
  userId?: string
  tripId?: string
  entryType?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  mood?: number
  privacyLevel?: string
  hasMedia?: boolean
  searchQuery?: string
  limit?: number
  offset?: number
}

export interface NearbySearchParams {
  lat: number
  lng: number
  radiusKm: number
  userId?: string
  limit?: number
}

export interface SyncConflict {
  entryId: string
  localVersion: any
  serverVersion: any
  conflictType: 'update' | 'delete'
  resolvedAt?: Date
}

export interface OfflineSyncPayload {
  entries: Array<{
    localId: string
    entry: JournalEntryCreateInput
    media?: Array<{
      localId: string
      mediaData: string // base64
      metadata: JournalMediaInput
    }>
  }>
  deletedEntries?: string[]
  lastSyncTimestamp?: Date
}