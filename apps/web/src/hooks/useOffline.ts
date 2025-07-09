'use client'

import { useState, useEffect, useCallback } from 'react'
import { offlineDb } from '@/lib/offline/db'
import { offlineSync } from '@/lib/offline/sync'

interface UseOfflineOptions {
  autoSync?: boolean
  syncInterval?: number
}

export function useOffline(options: UseOfflineOptions = {}) {
  const { autoSync = true, syncInterval = 30000 } = options
  
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Update pending count
    const updatePendingCount = async () => {
      const count = await offlineDb.getUnsyncedCount()
      setPendingCount(count)
    }
    updatePendingCount()

    // Online/offline event handlers
    const handleOnline = () => {
      setIsOnline(true)
      if (autoSync) {
        syncData()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Start periodic sync if enabled
    if (autoSync) {
      offlineSync.startPeriodicSync(syncInterval)
    }

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      offlineSync.stopPeriodicSync()
      clearInterval(interval)
    }
  }, [autoSync, syncInterval])

  const syncData = useCallback(async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    try {
      const result = await offlineSync.syncPendingChanges()
      setLastSyncTime(new Date())
      
      // Update pending count
      const count = await offlineDb.getUnsyncedCount()
      setPendingCount(count)
      
      return result
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing])

  const downloadForOffline = useCallback(async () => {
    if (!isOnline) return

    try {
      await offlineSync.downloadForOffline()
      return true
    } catch (error) {
      console.error('Error downloading for offline:', error)
      return false
    }
  }, [isOnline])

  const clearOfflineData = useCallback(async () => {
    try {
      await offlineDb.clearAll()
      setPendingCount(0)
      return true
    } catch (error) {
      console.error('Error clearing offline data:', error)
      return false
    }
  }, [])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncData,
    downloadForOffline,
    clearOfflineData,
  }
}