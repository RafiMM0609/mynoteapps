'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { ToastMessage } from '../hooks/useToast'

interface ToastProps {
  toast: ToastMessage
  onRemove: (id: string) => void
}

const iconMap = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
}

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

export default function Toast({ toast, onRemove }: ToastProps) {
  const Icon = iconMap[toast.type]

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onRemove])

  return (
    <div className={`
      max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
      ${colorMap[toast.type]}
      animate-fade-in
    `}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">
              {toast.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => onRemove(toast.id)}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isEditorActive, setIsEditorActive] = useState(false)

  // Detect mobile devices and editor focus state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check if note editor is focused or user is typing
    const checkEditorActivity = () => {
      const editor = document.querySelector('[contenteditable="true"]')
      const isActiveElement = document.activeElement === editor
      setIsEditorActive(isActiveElement)
    }
    
    checkMobile()
    checkEditorActivity()
    
    window.addEventListener('resize', checkMobile)
    document.addEventListener('focusin', checkEditorActivity)
    document.addEventListener('click', checkEditorActivity)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      document.removeEventListener('focusin', checkEditorActivity)
      document.removeEventListener('click', checkEditorActivity)
    }
  }, [])

  // Determine the optimal toast position based on device and context
  const getToastPositionClasses = () => {
    if (isMobile) {
      // On mobile, if editor is active, place toasts at the top to avoid keyboard
      if (isEditorActive) {
        return 'flex-col items-center top-0 pt-safe sm:items-start'
      }
      // Otherwise, place at bottom but with extra padding for mobile navigation
      return 'flex-col-reverse items-center bottom-0 pb-16 mb-safe sm:items-end'
    }
    // Default desktop position (bottom right)
    return 'flex-col-reverse items-end bottom-0 sm:items-end'
  }

  return (
    <div
      aria-live="assertive"
      className={`fixed inset-x-0 px-4 py-6 pointer-events-none sm:p-6 z-50 ${getToastPositionClasses()}`}
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </div>
  )
}
