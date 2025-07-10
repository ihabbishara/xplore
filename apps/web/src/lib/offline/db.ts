import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Database schema
interface XploreDB extends DBSchema {
  locations: {
    key: string
    value: {
      id: string
      placeId: string
      name: string
      country?: string
      city?: string
      region?: string
      address: string
      coordinates: { lat: number; lng: number }
      type: string
      savedAt: string
      lastSynced?: string
      isOffline?: boolean
    }
  }
  trips: {
    key: string
    value: {
      id: string
      name: string
      description?: string
      startDate: string
      endDate: string
      destinations: any[]
      savedAt: string
      lastSynced?: string
      isOffline?: boolean
    }
  }
  journalEntries: {
    key: string
    value: {
      id: string
      tripId?: string
      locationId?: string
      title: string
      content: string
      mood?: string
      weather?: any
      media?: any[]
      createdAt: string
      lastSynced?: string
      isOffline?: boolean
    }
  }
  checklists: {
    key: string
    value: {
      id: string
      name: string
      description?: string
      category: string
      items: any[]
      createdAt: string
      lastSynced?: string
      isOffline?: boolean
    }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      type: 'location' | 'trip' | 'journal' | 'checklist'
      action: 'create' | 'update' | 'delete'
      data: any
      timestamp: string
      retries: number
    }
  }
}

class OfflineDatabase {
  private db: IDBPDatabase<XploreDB> | null = null
  private readonly DB_NAME = 'xplore-offline'
  private readonly DB_VERSION = 1

  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB<XploreDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('locations')) {
          const locationStore = db.createObjectStore('locations', { keyPath: 'id' })
          ;(locationStore as any).createIndex('placeId', 'placeId')
          ;(locationStore as any).createIndex('savedAt', 'savedAt')
        }

        if (!db.objectStoreNames.contains('trips')) {
          const tripStore = db.createObjectStore('trips', { keyPath: 'id' })
          ;(tripStore as any).createIndex('startDate', 'startDate')
          ;(tripStore as any).createIndex('savedAt', 'savedAt')
        }

        if (!db.objectStoreNames.contains('journalEntries')) {
          const journalStore = db.createObjectStore('journalEntries', { keyPath: 'id' })
          ;(journalStore as any).createIndex('tripId', 'tripId')
          ;(journalStore as any).createIndex('locationId', 'locationId')
          ;(journalStore as any).createIndex('createdAt', 'createdAt')
        }

        if (!db.objectStoreNames.contains('checklists')) {
          const checklistStore = db.createObjectStore('checklists', { keyPath: 'id' })
          ;(checklistStore as any).createIndex('category', 'category')
          ;(checklistStore as any).createIndex('createdAt', 'createdAt')
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          ;(syncStore as any).createIndex('type', 'type')
          ;(syncStore as any).createIndex('timestamp', 'timestamp')
        }
      },
    })
  }

  async ensureDb(): Promise<IDBPDatabase<XploreDB>> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  // Location methods
  async saveLocation(location: XploreDB['locations']['value']): Promise<void> {
    const db = await this.ensureDb()
    await db.put('locations', {
      ...location,
      savedAt: new Date().toISOString(),
      isOffline: !navigator.onLine,
    })

    // Add to sync queue if offline
    if (!navigator.onLine) {
      await this.addToSyncQueue('location', 'create', location)
    }
  }

  async getLocation(id: string): Promise<XploreDB['locations']['value'] | undefined> {
    const db = await this.ensureDb()
    return db.get('locations', id)
  }

  async getAllLocations(): Promise<XploreDB['locations']['value'][]> {
    const db = await this.ensureDb()
    return db.getAll('locations')
  }

  async deleteLocation(id: string): Promise<void> {
    const db = await this.ensureDb()
    await db.delete('locations', id)

    if (!navigator.onLine) {
      await this.addToSyncQueue('location', 'delete', { id })
    }
  }

  // Trip methods
  async saveTrip(trip: XploreDB['trips']['value']): Promise<void> {
    const db = await this.ensureDb()
    await db.put('trips', {
      ...trip,
      savedAt: new Date().toISOString(),
      isOffline: !navigator.onLine,
    })

    if (!navigator.onLine) {
      await this.addToSyncQueue('trip', 'create', trip)
    }
  }

  async getTrip(id: string): Promise<XploreDB['trips']['value'] | undefined> {
    const db = await this.ensureDb()
    return db.get('trips', id)
  }

  async getAllTrips(): Promise<XploreDB['trips']['value'][]> {
    const db = await this.ensureDb()
    return db.getAll('trips')
  }

  // Journal methods
  async saveJournalEntry(entry: XploreDB['journalEntries']['value']): Promise<void> {
    const db = await this.ensureDb()
    await db.put('journalEntries', {
      ...entry,
      createdAt: entry.createdAt || new Date().toISOString(),
      isOffline: !navigator.onLine,
    })

    if (!navigator.onLine) {
      await this.addToSyncQueue('journal', 'create', entry)
    }
  }

  async getJournalEntry(id: string): Promise<XploreDB['journalEntries']['value'] | undefined> {
    const db = await this.ensureDb()
    return db.get('journalEntries', id)
  }

  async getJournalEntriesByTrip(tripId: string): Promise<XploreDB['journalEntries']['value'][]> {
    const db = await this.ensureDb()
    const index = (db.transaction('journalEntries').store as any).index('tripId')
    return index.getAll(tripId)
  }

  // Checklist methods
  async saveChecklist(checklist: XploreDB['checklists']['value']): Promise<void> {
    const db = await this.ensureDb()
    await db.put('checklists', {
      ...checklist,
      createdAt: checklist.createdAt || new Date().toISOString(),
      isOffline: !navigator.onLine,
    })

    if (!navigator.onLine) {
      await this.addToSyncQueue('checklist', 'create', checklist)
    }
  }

  async getChecklist(id: string): Promise<XploreDB['checklists']['value'] | undefined> {
    const db = await this.ensureDb()
    return db.get('checklists', id)
  }

  async getAllChecklists(): Promise<XploreDB['checklists']['value'][]> {
    const db = await this.ensureDb()
    return db.getAll('checklists')
  }

  // Sync queue methods
  async addToSyncQueue(
    type: XploreDB['syncQueue']['value']['type'],
    action: XploreDB['syncQueue']['value']['action'],
    data: any
  ): Promise<void> {
    const db = await this.ensureDb()
    const id = `${type}-${action}-${Date.now()}-${Math.random()}`
    
    await db.put('syncQueue', {
      id,
      type,
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    })
  }

  async getSyncQueue(): Promise<XploreDB['syncQueue']['value'][]> {
    const db = await this.ensureDb()
    return db.getAll('syncQueue')
  }

  async removeSyncItem(id: string): Promise<void> {
    const db = await this.ensureDb()
    await db.delete('syncQueue', id)
  }

  async updateSyncItem(item: XploreDB['syncQueue']['value']): Promise<void> {
    const db = await this.ensureDb()
    await db.put('syncQueue', item)
  }

  // Clear all offline data
  async clearAll(): Promise<void> {
    const db = await this.ensureDb()
    const stores = ['locations', 'trips', 'journalEntries', 'checklists', 'syncQueue'] as const
    
    const tx = db.transaction(stores as any, 'readwrite')
    await Promise.all(stores.map(store => tx.objectStore(store).clear()))
    await tx.done
  }

  // Check if data needs sync
  async getUnsyncedCount(): Promise<number> {
    const db = await this.ensureDb()
    return db.count('syncQueue')
  }
}

// Export singleton instance
export const offlineDb = new OfflineDatabase()

// Initialize on import
if (typeof window !== 'undefined') {
  offlineDb.init().catch(console.error)
}