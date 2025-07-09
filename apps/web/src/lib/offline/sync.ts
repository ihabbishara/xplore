import { offlineDb } from './db'
import { apiClient } from '../api/client'

interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

class OfflineSyncService {
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null

  // Start periodic sync
  startPeriodicSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncPendingChanges()
      }
    }, intervalMs)

    // Sync immediately if online
    if (navigator.onLine) {
      this.syncPendingChanges()
    }
  }

  // Stop periodic sync
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Sync all pending changes
  async syncPendingChanges(): Promise<SyncResult> {
    if (this.isSyncing || !navigator.onLine) {
      return { success: false, synced: 0, failed: 0, errors: [] }
    }

    this.isSyncing = true
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    }

    try {
      const syncQueue = await offlineDb.getSyncQueue()

      for (const item of syncQueue) {
        try {
          await this.syncItem(item)
          await offlineDb.removeSyncItem(item.id)
          result.synced++
        } catch (error) {
          result.failed++
          result.errors.push({
            id: item.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })

          // Update retry count
          item.retries++
          if (item.retries < 3) {
            await offlineDb.updateSyncItem(item)
          } else {
            // Remove after 3 retries
            await offlineDb.removeSyncItem(item.id)
          }
        }
      }

      result.success = result.failed === 0
    } catch (error) {
      console.error('Sync error:', error)
      result.success = false
    } finally {
      this.isSyncing = false
    }

    return result
  }

  // Sync individual item
  private async syncItem(item: any): Promise<void> {
    const { type, action, data } = item

    switch (type) {
      case 'location':
        await this.syncLocation(action, data)
        break
      case 'trip':
        await this.syncTrip(action, data)
        break
      case 'journal':
        await this.syncJournalEntry(action, data)
        break
      case 'checklist':
        await this.syncChecklist(action, data)
        break
      default:
        throw new Error(`Unknown sync type: ${type}`)
    }
  }

  // Sync location
  private async syncLocation(action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await apiClient.post('/locations/save', {
          placeId: data.placeId,
          name: data.name,
          country: data.country,
          city: data.city,
          region: data.region,
          address: data.address,
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng,
          placeType: data.type,
        })
        break
      case 'delete':
        await apiClient.delete(`/locations/${data.id}`)
        break
      default:
        throw new Error(`Unknown location action: ${action}`)
    }
  }

  // Sync trip
  private async syncTrip(action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await apiClient.post('/trips', data)
        break
      case 'update':
        await apiClient.put(`/trips/${data.id}`, data)
        break
      case 'delete':
        await apiClient.delete(`/trips/${data.id}`)
        break
      default:
        throw new Error(`Unknown trip action: ${action}`)
    }
  }

  // Sync journal entry
  private async syncJournalEntry(action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await apiClient.post('/journal/entries', data)
        break
      case 'update':
        await apiClient.put(`/journal/entries/${data.id}`, data)
        break
      case 'delete':
        await apiClient.delete(`/journal/entries/${data.id}`)
        break
      default:
        throw new Error(`Unknown journal action: ${action}`)
    }
  }

  // Sync checklist
  private async syncChecklist(action: string, data: any): Promise<void> {
    switch (action) {
      case 'create':
        await apiClient.post('/checklists', data)
        break
      case 'update':
        await apiClient.put(`/checklists/${data.id}`, data)
        break
      case 'delete':
        await apiClient.delete(`/checklists/${data.id}`)
        break
      default:
        throw new Error(`Unknown checklist action: ${action}`)
    }
  }

  // Download data for offline use
  async downloadForOffline(): Promise<void> {
    if (!navigator.onLine) return

    try {
      // Download user's saved locations
      const locationsResponse = await apiClient.get('/locations/saved')
      if (locationsResponse.data.success) {
        for (const location of locationsResponse.data.data) {
          await offlineDb.saveLocation({
            ...location,
            lastSynced: new Date().toISOString(),
          })
        }
      }

      // Download user's trips
      const tripsResponse = await apiClient.get('/trips')
      if (tripsResponse.data.success) {
        for (const trip of tripsResponse.data.data) {
          await offlineDb.saveTrip({
            ...trip,
            lastSynced: new Date().toISOString(),
          })
        }
      }

      // Download recent journal entries
      const journalResponse = await apiClient.get('/journal/entries', {
        params: { limit: 50 },
      })
      if (journalResponse.data.success) {
        for (const entry of journalResponse.data.data) {
          await offlineDb.saveJournalEntry({
            ...entry,
            lastSynced: new Date().toISOString(),
          })
        }
      }

      // Download checklists
      const checklistsResponse = await apiClient.get('/checklists')
      if (checklistsResponse.data.success) {
        for (const checklist of checklistsResponse.data.data) {
          await offlineDb.saveChecklist({
            ...checklist,
            lastSynced: new Date().toISOString(),
          })
        }
      }

      console.log('Offline data download complete')
    } catch (error) {
      console.error('Error downloading offline data:', error)
    }
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncService()

// Start sync when online status changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online - syncing...')
    offlineSync.syncPendingChanges()
  })

  window.addEventListener('offline', () => {
    console.log('Gone offline')
  })
}