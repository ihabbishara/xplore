import { PrismaClient } from '@prisma/client'
import { OfflineSyncPayload, SyncConflict } from '../types/journal.types'
import { JournalService } from './journalService'

export class OfflineSyncService {
  constructor(
    private prisma: PrismaClient,
    private journalService: JournalService
  ) {}

  async syncOfflineEntries(userId: string, payload: OfflineSyncPayload): Promise<{
    synced: string[]
    conflicts: SyncConflict[]
    errors: Array<{ localId: string; error: string }>
  }> {
    const synced: string[] = []
    const conflicts: SyncConflict[] = []
    const errors: Array<{ localId: string; error: string }> = []
    
    // Process new/updated entries
    for (const offlineEntry of payload.entries) {
      try {
        // Check if entry already exists (by localId)
        const existing = await this.prisma.journalEntry.findFirst({
          where: {
            userId,
            localId: offlineEntry.localId
          }
        })
        
        if (existing) {
          // Check for conflicts
          const hasConflict = await this.detectConflict(
            existing,
            offlineEntry.entry,
            payload.lastSyncTimestamp
          )
          
          if (hasConflict) {
            conflicts.push({
              entryId: existing.id,
              localVersion: offlineEntry.entry,
              serverVersion: existing,
              conflictType: 'update'
            })
            continue
          }
          
          // Update existing entry
          await this.journalService.updateEntry(
            existing.id,
            userId,
            {
              title: offlineEntry.entry.title,
              content: offlineEntry.entry.content,
              tags: offlineEntry.entry.tags,
              mood: offlineEntry.entry.mood
            }
          )
        } else {
          // Create new entry
          const created = await this.journalService.createEntry(userId, {
            ...offlineEntry.entry
          } as any)
          
          // Process media if any
          if (offlineEntry.media) {
            for (const mediaItem of offlineEntry.media) {
              try {
                // Convert base64 to buffer
                const buffer = Buffer.from(mediaItem.mediaData, 'base64')
                const file = {
                  buffer,
                  originalname: mediaItem.metadata.originalFilename || 'upload',
                  mimetype: mediaItem.metadata.mimeType || 'application/octet-stream',
                  size: buffer.length
                }
                
                await this.journalService.addMedia(
                  created.id,
                  userId,
                  file,
                  mediaItem.metadata
                )
              } catch (mediaError) {
                console.error('Media sync error:', mediaError)
              }
            }
          }
        }
        
        synced.push(offlineEntry.localId)
      } catch (error: any) {
        errors.push({
          localId: offlineEntry.localId,
          error: error.message || 'Unknown error'
        })
      }
    }
    
    // Process deleted entries
    if (payload.deletedEntries) {
      for (const localId of payload.deletedEntries) {
        try {
          const entry = await this.prisma.journalEntry.findFirst({
            where: { userId, localId }
          })
          
          if (entry) {
            await this.journalService.deleteEntry(entry.id, userId)
            synced.push(localId)
          }
        } catch (error: any) {
          errors.push({
            localId,
            error: error.message || 'Failed to delete'
          })
        }
      }
    }
    
    return { synced, conflicts, errors }
  }

  async getConflicts(userId: string): Promise<SyncConflict[]> {
    // In a real implementation, you'd store conflicts in a separate table
    // For now, return empty array
    return []
  }

  async resolveConflict(
    userId: string,
    entryId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ): Promise<void> {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id: entryId, userId }
    })
    
    if (!entry) {
      throw new Error('Entry not found')
    }
    
    if (resolution === 'local') {
      // Keep local version (from mergedData)
      await this.journalService.updateEntry(entryId, userId, mergedData)
    } else if (resolution === 'merge') {
      // Apply merged version
      await this.journalService.updateEntry(entryId, userId, mergedData)
    }
    // If 'server', do nothing (keep server version)
    
    // Mark as synced
    await this.prisma.journalEntry.update({
      where: { id: entryId },
      data: { syncStatus: 'synced' }
    })
  }

  private async detectConflict(
    serverEntry: any,
    localEntry: any,
    lastSyncTimestamp?: Date
  ): Promise<boolean> {
    if (!lastSyncTimestamp) {
      return false // No sync history, no conflict
    }
    
    // Check if server was updated after last sync
    const serverUpdatedAfterSync = new Date(serverEntry.updatedAt) > lastSyncTimestamp
    
    // Simple conflict detection: if server was updated after last sync
    // and local has changes, there's a conflict
    if (serverUpdatedAfterSync) {
      // Compare key fields
      const hasLocalChanges = 
        serverEntry.content !== localEntry.content ||
        serverEntry.title !== localEntry.title ||
        JSON.stringify(serverEntry.tags) !== JSON.stringify(localEntry.tags)
      
      return hasLocalChanges
    }
    
    return false
  }

  async queueForSync(userId: string, entry: any): Promise<void> {
    // In a real implementation, you'd use a queue service
    // For now, just mark the entry as pending sync
    await this.prisma.journalEntry.update({
      where: { id: entry.id },
      data: { syncStatus: 'pending' }
    })
  }
}