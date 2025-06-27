'use client'

import { useEffect } from 'react'
import { ToastContainer } from './Toast'
import NetworkStatus from './NetworkStatus'
import AppProviders, { useAppToast, useAppNetwork } from './AppProviders'

function AppContent({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useAppToast()
  const { isOnline } = useAppNetwork()
  
  // Register service worker for offline functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope)
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err)
          }
        )
      })
    }
  }, [])

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <NetworkStatus />
    </>
  )
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppContent>{children}</AppContent>
    </AppProviders>
  )
}
