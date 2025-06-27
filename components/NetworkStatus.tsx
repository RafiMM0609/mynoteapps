'use client'

import { useState, useEffect } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { WifiIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'

// Define a fallback for offline stats
const DEFAULT_STATS = {
  unsyncedNotes: 0,
  queueSize: 0,
  lastSync: null as number | null,
}

export default function NetworkStatus() {
  const { isOnline } = useOnlineStatus()
  const [syncStatus, setSyncStatus] = useState({
    unsyncedNotes: 0,
    queueSize: 0,
    lastSync: null as number | null,
    isSyncing: false
  })
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Check sync status regularly
  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    let isMounted = true;
    
    const updateSyncInfo = async () => {
      // Skip the complex offline storage check for now to avoid chunk loading issues
      // This can be re-enabled once the main app is stable
      try {
        if (isMounted) {
          setSyncStatus(prev => ({
            ...prev,
            ...DEFAULT_STATS
          }))
        }
      } catch (error) {
        console.error('Failed to update sync info:', error)
      }
    }
    
    // Check immediately and then periodically
    updateSyncInfo()
    const interval = setInterval(updateSyncInfo, 30000) // Every 30 seconds
    
    return () => {
      isMounted = false;
      clearInterval(interval)
    }
  }, [])
  
  // Show sync status when coming back online
  useEffect(() => {
    if (isOnline && syncStatus.queueSize > 0) {
      setIsExpanded(true)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsExpanded(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isOnline, syncStatus.queueSize])
  
  // Format last sync time
  const formatLastSync = () => {
    if (!syncStatus.lastSync) return 'Never'
    
    const now = new Date()
    const syncTime = new Date(syncStatus.lastSync)
    const diffMinutes = Math.floor((now.getTime() - syncTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }
  
  // No need to show anything when everything is synced and online
  if (isOnline && syncStatus.queueSize === 0 && !isExpanded) {
    return null
  }
  
  return (
    <div 
      className={`fixed bottom-4 ${isExpanded ? 'right-4' : 'right-2'} z-40 flex items-center transition-all duration-300 ease-in-out`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center space-x-3 cursor-pointer animate-fade-in max-w-xs">
          <div className="flex-shrink-0">
            {isOnline ? (
              <WifiIcon className="h-5 w-5 text-green-500" />
            ) : (
              <WifiIcon className="h-5 w-5 text-orange-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {isOnline ? 'Online' : 'Offline Mode'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {syncStatus.queueSize > 0 
                ? `${syncStatus.unsyncedNotes} note${syncStatus.unsyncedNotes !== 1 ? 's' : ''} pending sync` 
                : 'All changes synced'}
            </p>
            {syncStatus.lastSync && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Last sync: {formatLastSync()}
              </p>
            )}
          </div>
          {syncStatus.isSyncing && (
            <div className="flex-shrink-0">
              <CloudArrowUpIcon className="h-5 w-5 text-blue-500 animate-pulse" />
            </div>
          )}
        </div>
      ) : (
        <div 
          className={`rounded-full w-8 h-8 flex items-center justify-center shadow-md cursor-pointer ${
            isOnline 
              ? syncStatus.queueSize > 0 
                ? 'bg-yellow-100 dark:bg-yellow-900' 
                : 'bg-green-100 dark:bg-green-900'
              : 'bg-orange-100 dark:bg-orange-900'
          }`}
        >
          {isOnline ? (
            syncStatus.queueSize > 0 ? (
              <CloudArrowUpIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <WifiIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            )
          ) : (
            <WifiIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          )}
        </div>
      )}
    </div>
  )
}
