'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ToastContainer } from '../components/Toast'
import { useToast } from '../hooks/useToast'

// Load NetworkStatus dynamically to avoid chunk loading issues
const NetworkStatus = dynamic(() => import('./NetworkStatus'), {
  ssr: false,
  loading: () => <div className="hidden">Loading network status...</div>
})

// Create a safer version of useBackgroundSync that doesn't break the render
const SafeBackgroundSync = () => {
  // Safely attempt to load the hook
  const [syncState, setSyncState] = useState({
    isSyncing: false,
    lastSync: null as number | null,
    unsyncedNotes: 0
  })
  
  useEffect(() => {
    let isMounted = true
    
    const loadBackgroundSync = async () => {
      try {
        const { useBackgroundSync } = await import('../hooks/useBackgroundSync')
        if (isMounted && typeof useBackgroundSync === 'function') {
          const { isSyncing, lastSyncResult } = useBackgroundSync()
          setSyncState({ 
            isSyncing, 
            lastSync: lastSyncResult?.timestamp || null, 
            unsyncedNotes: 0 
          })
        }
      } catch (error) {
        console.error('Failed to load background sync:', error)
      }
    }
    
    loadBackgroundSync()
    
    return () => {
      isMounted = false
    }
  }, [])
  
  return syncState
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast()
  
  // Use the safer version of the hook
  const { isSyncing } = SafeBackgroundSync()
  
  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Suspense fallback={null}>
        <NetworkStatus />
      </Suspense>
    </>
  )
}
