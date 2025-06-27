'use client'

import { useEffect, Suspense } from 'react'
import { ToastContainer } from './Toast'
import dynamic from 'next/dynamic'
import AppProviders, { useAppToast, useAppNetwork } from './AppProviders'

// Dynamically import NetworkStatus to avoid chunk loading issues
const NetworkStatus = dynamic(() => import('./NetworkStatus'), {
  ssr: false,
  loading: () => null
})

function AppContent({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useAppToast()
  
  // Register service worker for offline functionality
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    
    try {
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
    } catch (error) {
      console.error('Error registering service worker:', error)
    }
  }, [])

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

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppContent>{children}</AppContent>
    </AppProviders>
  )
}
