'use client'

import { useEffect, useState } from 'react'

interface KeyboardShortcutsProps {
  isVisible: boolean
  onClose: () => void
}

export default function KeyboardShortcuts({ isVisible, onClose }: KeyboardShortcutsProps) {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null
  const cmdKey = isMac ? '⌘' : 'Ctrl'
  const shortcuts = [
    { keys: `${cmdKey} + S`, description: 'Save note' },
    { keys: `${cmdKey} + B`, description: 'Bold text' },
    { keys: `${cmdKey} + I`, description: 'Italic text' },
    { keys: `${cmdKey} + Enter`, description: 'Toggle preview' },
    { keys: `${cmdKey} + Shift + Enter`, description: 'Toggle split view' },
    { keys: `${cmdKey} + Shift + V`, description: 'Paste as plain text' },
    { keys: `${cmdKey} + N`, description: 'New note' },
    { keys: `${cmdKey} + /`, description: 'Show shortcuts' },
    { keys: 'Escape', description: 'Close dialogs' }
  ]

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Keyboard Shortcuts
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
