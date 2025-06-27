'use client'

import { useState, createContext, useContext, ReactNode } from 'react'
import { ToastMessage } from '../hooks/useToast'

// Create contexts
interface ToastContextType {
  toasts: ToastMessage[]
  showToast: (message: string, type?: ToastMessage['type'], duration?: number) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

interface NetworkContextType {
  isOnline: boolean
  hasPendingChanges: boolean
  syncStatus: {
    unsyncedNotes: number
    queueSize: number
    lastSync: number | null
    isSyncing: boolean
  }
  syncChanges: () => Promise<void>
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)
export const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

// Create provider component
export default function AppProviders({ children }: { children: ReactNode }) {
  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (message: string, type: ToastMessage['type'] = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: ToastMessage = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  // Network state (simplified for now)
  const [networkState, setNetworkState] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasPendingChanges: false,
    syncStatus: {
      unsyncedNotes: 0,
      queueSize: 0,
      lastSync: null as number | null,
      isSyncing: false
    }
  })

  const syncChanges = async () => {
    // This will be implemented with the useBackgroundSync hook
    return Promise.resolve()
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, clearAllToasts }}>
      <NetworkContext.Provider 
        value={{ 
          isOnline: networkState.isOnline,
          hasPendingChanges: networkState.hasPendingChanges,
          syncStatus: networkState.syncStatus,
          syncChanges
        }}
      >
        {children}
      </NetworkContext.Provider>
    </ToastContext.Provider>
  )
}

// Custom hooks to use these contexts
export const useAppToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useAppToast must be used within an AppProviders')
  }
  return context
}

export const useAppNetwork = () => {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error('useAppNetwork must be used within an AppProviders')
  }
  return context
}
