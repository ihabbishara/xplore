'use client'

import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { offlineSync } from '@/lib/offline/sync'
import { offlineDb } from '@/lib/offline/db'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Check pending sync items
    const checkPending = async () => {
      const count = await offlineDb.getUnsyncedCount()
      setPendingCount(count)
    }
    checkPending()

    // Event listeners
    const handleOnline = async () => {
      setIsOnline(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      
      // Auto-sync when coming online
      setIsSyncing(true)
      const result = await offlineSync.syncPendingChanges()
      setIsSyncing(false)
      checkPending()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Start periodic sync
    offlineSync.startPeriodicSync()

    // Check pending items periodically
    const interval = setInterval(checkPending, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      offlineSync.stopPeriodicSync()
      clearInterval(interval)
    }
  }, [])

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    const result = await offlineSync.syncPendingChanges()
    setIsSyncing(false)
    
    const count = await offlineDb.getUnsyncedCount()
    setPendingCount(count)
  }

  if (isOnline && pendingCount === 0 && !showToast) {
    return null // Don't show indicator when online and synced
  }

  return (
    <>
      {/* Status indicator */}
      <div className="fixed bottom-4 left-4 z-50">
        {!isOnline && (
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <WifiOff className="h-5 w-5" />
            <span className="text-sm font-medium">Offline Mode</span>
          </div>
        )}

        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {isSyncing ? 'Syncing...' : `Sync ${pendingCount} changes`}
            </span>
          </button>
        )}
      </div>

      {/* Toast notifications */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-50 transition-opacity duration-300 ${
            showToast ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 ${
              isOnline ? 'bg-green-500' : 'bg-yellow-500'
            } text-white`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5" />
                <div>
                  <p className="font-medium">Back Online</p>
                  <p className="text-sm opacity-90">Your changes will be synced</p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5" />
                <div>
                  <p className="font-medium">You're Offline</p>
                  <p className="text-sm opacity-90">Changes will sync when online</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}