'use client'

import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  value?: string
  autoFocus?: boolean
  onOpenModal?: () => void // Add callback for opening modal
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search notes...", 
  value = "",
  autoFocus = false,
  onOpenModal
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  useEffect(() => {
    // Auto focus when component mounts if requested
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, onSearch])

  const handleClear = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (searchQuery) {
        handleClear()
      } else {
        inputRef.current?.blur()
      }
    }
  }

  return (
    <div className="relative w-full">
      <div className={`
        relative flex items-center transition-all duration-300 ease-in-out
        ${isFocused 
          ? 'ring-2 ring-primary-400 ring-opacity-50 shadow-lg transform scale-[1.02]' 
          : 'ring-1 ring-gray-200 hover:ring-gray-300'
        }
        rounded-xl bg-white/90 backdrop-blur-sm border-0
        overflow-hidden
      `}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <MagnifyingGlassIcon className={`
            h-5 w-5 transition-all duration-300
            ${isFocused || searchQuery 
              ? 'text-primary-500 scale-110' 
              : 'text-gray-400'
            }
          `} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className="
            block w-full pl-12 pr-12 py-3 text-sm font-medium
            bg-transparent border-0 
            placeholder-gray-400 text-gray-800
            focus:outline-none focus:ring-0
            transition-all duration-200
          "
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
        />
        
        {searchQuery ? (
          <button
            onClick={handleClear}
            className="
              absolute inset-y-0 right-0 pr-4 flex items-center z-10
              text-gray-400 hover:text-red-500 transition-all duration-200
              hover:scale-110 active:scale-95
            "
            title="Clear search (Esc)"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100/80 border border-gray-200/60 rounded-md backdrop-blur-sm">
              <span className="text-[10px]">⌘K</span>
            </kbd>
          </div>
        )}
        
        {/* Advanced Search Button */}
        {onOpenModal && (
          <button
            onClick={onOpenModal}
            className="absolute inset-y-0 right-12 pr-2 flex items-center z-10 text-gray-400 hover:text-blue-500 transition-colors duration-200"
            title="Open Advanced Search (Ctrl+K)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
      
      {/* Enhanced search info with better positioning */}
      {searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">
                🔍 Searching for "<span className="text-primary-600 font-semibold">{searchQuery}</span>"
              </span>
              <span className="text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                ESC to clear
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
