'use client'

import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  value?: string
  autoFocus?: boolean
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search notes...", 
  value = "",
  autoFocus = false 
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
    <div className="relative">
      <div className={`
        relative flex items-center transition-all duration-200
        ${isFocused 
          ? 'ring-2 ring-blue-500 ring-opacity-50' 
          : 'ring-1 ring-gray-300'
        }
        rounded-lg bg-white
      `}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className={`
            h-4 w-4 transition-colors duration-200
            ${isFocused || searchQuery ? 'text-blue-500' : 'text-gray-400'}
          `} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className="
            block w-full pl-10 pr-10 py-2.5 text-sm
            bg-transparent border-0 
            placeholder-gray-500 text-gray-900
            focus:outline-none focus:ring-0
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
              absolute inset-y-0 right-0 pr-3 flex items-center
              text-gray-400 hover:text-gray-600 transition-colors duration-200
            "
            title="Clear search (Esc)"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">
              ⌘K
            </kbd>
          </div>
        )}
      </div>
      
      {/* Search suggestions or results count can be added here */}
      {searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 px-3">
          <div className="flex items-center justify-between">
            <span>Searching for "{searchQuery}"</span>
            <span className="text-gray-400">ESC to clear</span>
          </div>
        </div>
      )}
    </div>
  )
}
