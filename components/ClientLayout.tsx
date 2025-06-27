'use client'

import { useState, useEffect } from 'react'
import { ToastContainer } from '../components/Toast'
import NetworkStatus from '../components/NetworkStatus'
import { useToast } from '../hooks/useToast'
import { useBackgroundSync } from '../hooks/useBackgroundSync'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast()
  const { isSyncing } = useBackgroundSync()
  
  // Optional: Show toast when sync status changes
  const [lastSyncState, setLastSyncState] = useState(isSyncing)
  
  useEffect(() => {
    if (lastSyncState && !isSyncing) {
      // Sync just completed
    }
    setLastSyncState(isSyncing)
  }, [isSyncing, lastSyncState])

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <NetworkStatus />
    </>
  )
}
