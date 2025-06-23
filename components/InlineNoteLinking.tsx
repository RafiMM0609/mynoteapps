'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'

interface InlineNoteLinkingProps {
  isVisible: boolean
  position: { top: number; left: number }
  onSelect: (note: Note) => void
  onClose: () => void
  searchQuery: string
  availableNotes: Note[]
  currentNoteId?: string
  onCreateNewNote?: (title: string) => void
}

export default function InlineNoteLinking({ 
  isVisible, 
  position, 
  onSelect, 
  onClose, 
  searchQuery,
  availableNotes,
  currentNoteId,
  onCreateNewNote
}: InlineNoteLinkingProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter and search notes
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableNotes
        .filter(note => note.id !== currentNoteId)
        .slice(0, 10)
    }

    const query = searchQuery.toLowerCase()
    return availableNotes
      .filter(note => 
        note.id !== currentNoteId &&
        ((note.title?.toLowerCase() || '').includes(query) ||
         (note.content?.toLowerCase() || '').includes(query))
      )
      .sort((a, b) => {
        // Prioritize title matches over content matches
        const aTitle = (a.title || '').toLowerCase()
        const bTitle = (b.title || '').toLowerCase()
        const aTitleMatch = aTitle.includes(query)
        const bTitleMatch = bTitle.includes(query)
        
        if (aTitleMatch && !bTitleMatch) return -1
        if (!aTitleMatch && bTitleMatch) return 1
        
        // If both match title or both match content, sort by relevance
        const aIndex = aTitle.indexOf(query)
        const bIndex = bTitle.indexOf(query)
        
        return aIndex - bIndex
      })
      .slice(0, 10)
  }, [searchQuery, availableNotes, currentNoteId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isVisible && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTimeout(() => {
          onClose()
        }, 50)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVisible, onClose])

  // Reset selected index when notes change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredNotes])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return
      
      const totalItems = filteredNotes.length + (onCreateNewNote && searchQuery.trim() ? 1 : 0)
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => prev >= totalItems - 1 ? 0 : prev + 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex < filteredNotes.length) {
            onSelect(filteredNotes[selectedIndex])
          } else if (onCreateNewNote && searchQuery.trim()) {
            onCreateNewNote(searchQuery.trim())
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, filteredNotes, onSelect, onClose, searchQuery, onCreateNewNote])

  // Auto-scroll to selected item
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const items = dropdownRef.current.querySelectorAll('button')
      const selectedElement = items[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex])

  if (!isVisible || (filteredNotes.length === 0 && (!onCreateNewNote || !searchQuery.trim()))) {
    return null
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto min-w-80 custom-scrollbar"
      style={{
        top: typeof window !== 'undefined' ? Math.max(10, Math.min(position.top, window.innerHeight - 320)) : position.top,
        left: typeof window !== 'undefined' ? Math.max(10, Math.min(position.left, window.innerWidth - 320)) : position.left,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <MagnifyingGlassIcon className="w-3 h-3 mr-1" />
          <span className="font-medium">Link to Note</span>
          <span className="ml-auto">↑↓ Navigate • Enter Select • Esc Close</span>
        </div>
      </div>

      {/* Notes list */}
      <div className="py-1">
        {filteredNotes.map((note, index) => (
          <button
            key={note.id}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setTimeout(() => {
                onSelect(note)
              }, 0)
            }}
            className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-150 ${
              index === selectedIndex 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                : ''
            }`}
            type="button"
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150 ${
                index === selectedIndex 
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                <DocumentTextIcon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium transition-colors duration-150 truncate ${
                  index === selectedIndex 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {highlightText(note.title || 'Untitled', searchQuery)}
                </h4>
                {note.content && (
                  <p className={`text-xs mt-0.5 transition-colors duration-150 line-clamp-2 ${
                    index === selectedIndex 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {highlightText(
                      note.content.replace(/[#*`>\[\]]/g, '').slice(0, 100) + 
                      (note.content.length > 100 ? '...' : ''), 
                      searchQuery
                    )}
                  </p>
                )}
                <div className="flex items-center mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>
                    {note.updated_at ? new Date(note.updated_at).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Create new note option */}
        {onCreateNewNote && searchQuery.trim() && (
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setTimeout(() => {
                onCreateNewNote(searchQuery.trim())
              }, 0)
            }}
            className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-150 border-t border-gray-100 dark:border-gray-600 ${
              selectedIndex === filteredNotes.length
                ? 'bg-green-50 dark:bg-green-900/20 border-r-2 border-green-500' 
                : ''
            }`}
            type="button"
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150 ${
                selectedIndex === filteredNotes.length
                  ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                <PlusIcon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium transition-colors duration-150 ${
                  selectedIndex === filteredNotes.length
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  Create "{searchQuery.trim()}"
                </h4>
                <p className={`text-xs mt-0.5 transition-colors duration-150 ${
                  selectedIndex === filteredNotes.length
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  Create a new note with this title
                </p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Footer tip */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Type to search notes or create new ones
        </p>
      </div>
    </div>
  )
}
