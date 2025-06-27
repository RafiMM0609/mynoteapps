'use client'

import { PropsWithChildren, useEffect, useState } from 'react'
import { ToastContext, NetworkContext } from './AppProviders'
import { ToastMessage } from '../hooks/useToast'

/**
 * This component handles just the client-side providers
 * and is designed to avoid the chunk loading timeout issue
 */
export default function ClientProviders({ children }: PropsWithChildren) {
  // Simplified provider state
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isOnline, setIsOnline] = useState(true)
  
  // Basic online detection
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Create minimum viable context values
  const toastValue = {
    toasts,
    showToast: () => {},
    removeToast: () => {},
    clearAllToasts: () => {}
  }
  
  const networkValue = {
    isOnline,
    hasPendingChanges: false,
    syncStatus: {
      unsyncedNotes: 0,
      queueSize: 0,
      lastSync: null,
      isSyncing: false
    },
    syncChanges: async () => {}
  }
  
  return (
    <ToastContext.Provider value={toastValue}>
      <NetworkContext.Provider value={networkValue}>
        {children}
      </NetworkContext.Provider>
    </ToastContext.Provider>
  )
}
