'use client'

import React from 'react'
import { useOffline } from '@/hooks/useOffline'
import { Download, Trash2, RefreshCw, Wifi, WifiOff, HardDrive } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'

export default function OfflineSettingsPage() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncData,
    downloadForOffline,
    clearOfflineData,
  } = useOffline()

  const [isDownloading, setIsDownloading] = React.useState(false)
  const [storageUsed, setStorageUsed] = React.useState<number | null>(null)

  React.useEffect(() => {
    // Estimate storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        if (usage && quota) {
          setStorageUsed(Math.round((usage / quota) * 100))
        }
      })
    }
  }, [])

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadForOffline()
      alert('Data downloaded successfully for offline use!')
    } catch (error) {
      alert('Failed to download data. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      await clearOfflineData()
      alert('Offline data cleared successfully.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Offline Settings</h1>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          {isOnline ? (
            <>
              <Wifi className="h-5 w-5 mr-2 text-green-500" />
              Connection Status
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 mr-2 text-yellow-500" />
              Connection Status
            </>
          )}
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status</span>
            <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pending Changes</span>
            <span className="font-medium">{pendingCount}</span>
          </div>
          
          {lastSyncTime && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Synced</span>
              <span className="font-medium">
                {format(lastSyncTime, 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          )}
        </div>

        {pendingCount > 0 && isOnline && (
          <Button
            onClick={syncData}
            disabled={isSyncing}
            className="mt-4 w-full"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        )}
      </div>

      {/* Offline Data Management */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <HardDrive className="h-5 w-5 mr-2" />
          Offline Data
        </h2>

        {storageUsed !== null && (
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Storage Used</span>
              <span className="font-medium">{storageUsed}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${storageUsed}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleDownload}
            disabled={!isOnline || isDownloading}
            variant="secondary"
            className="w-full"
          >
            {isDownloading ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-bounce" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download for Offline Use
              </>
            )}
          </Button>

          <Button
            onClick={handleClearData}
            variant="danger"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Offline Data
          </Button>
        </div>
      </div>

      {/* Offline Features */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Available Offline</h2>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <div>
              <h3 className="font-medium">Saved Locations</h3>
              <p className="text-sm text-gray-600">View and manage your saved locations without internet</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <div>
              <h3 className="font-medium">Journal Entries</h3>
              <p className="text-sm text-gray-600">Create and edit journal entries offline</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <div>
              <h3 className="font-medium">Trip Planning</h3>
              <p className="text-sm text-gray-600">Access your trip plans and itineraries</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <div>
              <h3 className="font-medium">Checklists</h3>
              <p className="text-sm text-gray-600">Manage your travel checklists offline</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}