'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { useToast } from './useToast'

export function useBackgroundSync() {
  const { isOnline } = useOnlineStatus()
  const { showToast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: number;
    failed: number;
    timestamp: number;
  } | null>(null)

  // Trigger a sync when we come online
  useEffect(() => {
    if (isOnline) {
      syncChanges()
    }
  }, [isOnline])

  // Set up periodic background sync
  useEffect(() => {
    if (!isOnline) return
    
    // Sync every 5 minutes if online
    const syncInterval = setInterval(() => {
      syncChanges()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(syncInterval)
  }, [isOnline])

  // Function to manually trigger sync
  const syncChanges = useCallback(async () => {
    if (!isOnline || isSyncing) return
    
    try {
      setIsSyncing(true)
      
      // Dynamically import to avoid SSR issues
      const { default: offlineStorage } = await import('../lib/offline-storage')
      const notesModule = await import('../lib/notes')
      
      // Create an API adapter that matches what the sync queue expects
      const api = {
        createNote: notesModule.createNote,
        updateNote: notesModule.updateNote,
        deleteNote: notesModule.deleteNote
      }
      
      const result = await offlineStorage.processSyncQueue(api)
      
      setLastSyncResult({
        ...result,
        timestamp: Date.now()
      })
      
      // Show toast if changes were synced
      if (result.success > 0) {
        showToast(
          `Synced ${result.success} change${result.success !== 1 ? 's' : ''}`,
          'success'
        )
      }
      
      // Show warning if some syncs failed
      if (result.failed > 0) {
        showToast(
          `Failed to sync ${result.failed} change${result.failed !== 1 ? 's' : ''}`,
          'warning'
        )
      }
      
      return result
    } catch (error) {
      console.error('Background sync failed:', error)
      showToast('Sync failed, will retry later', 'error')
      return { success: 0, failed: 0 }
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, showToast])

  return {
    isSyncing,
    lastSyncResult,
    syncChanges
  }
}
