'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  DocumentTextIcon,
  ClockIcon,
  TagIcon,
  FolderIcon,
  ArrowRightIcon,
  HashtagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'
import { AdvancedSearch, type SearchResult } from '../lib/search-utils'
import { format } from 'date-fns'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  onSelectNote: (note: Note) => void
}

export default function SearchModal({ isOpen, onClose, notes, onSelectNote }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchStats, setSearchStats] = useState({ total: 0, searchTime: 0 })
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Auto focus when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Load recent searches when modal opens
  useEffect(() => {
    if (isOpen) {
      const recent = AdvancedSearch.getRecentSearches()
      setRecentSearches(recent)
      setShowRecentSearches(recent.length > 0 && !searchQuery)
    }
  }, [isOpen, searchQuery])

  // Search functionality with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      setSearchStats({ total: 0, searchTime: 0 })
      setSelectedIndex(0)
      return
    }

    setIsLoading(true)
    const startTime = Date.now()
    
    const timeoutId = setTimeout(() => {
      const searchResults = performSearch(searchQuery, notes)
      const searchTime = Date.now() - startTime
      
      setResults(searchResults)
      setSearchStats({ total: searchResults.length, searchTime })
      setSelectedIndex(0)
      setIsLoading(false)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, notes])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelectNote(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const performSearch = (query: string, notes: Note[]): SearchResult[] => {
    return AdvancedSearch.performSearch(query, notes)
  }

  const handleSelectNote = (result: SearchResult) => {
    // Find the original note by ID
    const originalNote = notes.find(note => note.id === result.id)
    if (originalNote) {
      AdvancedSearch.saveSearch(searchQuery) // Save search to recent searches
      onSelectNote(originalNote)
      onClose()
      setSearchQuery('')
    }
  }

  const getMatchTypeIcon = (matchType: SearchResult['matchType']) => {
    switch (matchType) {
      case 'title':
        return <DocumentTextIcon className="h-4 w-4 text-blue-500" />
      case 'content':
        return <HashtagIcon className="h-4 w-4 text-green-500" />
      case 'tag':
        return <TagIcon className="h-4 w-4 text-purple-500" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'Unknown date'
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-[8vh]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Search Header */}
                <div className="relative border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center px-4 py-4">
                    <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 mr-3" />
                    <input
                      ref={inputRef}
                      type="text"
                      className="flex-1 text-lg bg-transparent border-none outline-none placeholder-gray-400"
                      placeholder="Search your notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Search Stats */}
                  {searchQuery && (
                    <div className="px-4 pb-3">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {isLoading ? (
                            <span className="flex items-center">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
                              Searching...
                            </span>
                          ) : (
                            `${searchStats.total} results found in ${searchStats.searchTime}ms`
                          )}
                        </span>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="flex items-center">
                            <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-600">↑↓</kbd>
                            <span className="ml-1">Navigate</span>
                          </span>
                          <span className="flex items-center">
                            <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-600">↵</kbd>
                            <span className="ml-1">Select</span>
                          </span>
                          <span className="flex items-center">
                            <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-600">Esc</kbd>
                            <span className="ml-1">Close</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
                  {searchQuery && !isLoading && results.length === 0 && (
                    <div className="p-8 text-center">
                      <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-500">
                        Try adjusting your search terms or check for typos.
                      </p>
                    </div>
                  )}

                  {!searchQuery && (
                    <div className="p-8 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <MagnifyingGlassIcon className="h-8 w-8 text-gray-300" />
                        <span className="text-2xl">🔍</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start typing to search</h3>
                      <p className="text-gray-500 mb-4">
                        Search through your notes by title, content, or tags.
                      </p>
                      
                      {/* Recent Searches */}
                      {recentSearches.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">Recent Searches</h4>
                            <button
                              onClick={() => {
                                AdvancedSearch.clearRecentSearches()
                                setRecentSearches([])
                              }}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {recentSearches.slice(0, 5).map((query, index) => (
                              <button
                                key={index}
                                onClick={() => setSearchQuery(query)}
                                className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm transition-all duration-200 hover:scale-105"
                              >
                                {query}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-400 mt-6">
                        <span className="bg-gray-100 px-3 py-1 rounded-full">Tip: Use specific keywords</span>
                        <span className="bg-gray-100 px-3 py-1 rounded-full">Try searching for dates</span>
                      </div>
                    </div>
                  )}

                  {showRecentSearches && recentSearches.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Recent Searches
                      </h4>
                      {recentSearches.map((query, index) => (
                        <div
                          key={index}
                          className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                            index === selectedIndex
                              ? 'bg-blue-50 border-blue-100'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSearchQuery(query)}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-900">{query}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.map((result, index) => (
                    <div
                      key={result.id}
                      className={`p-4 border-b border-gray-50 cursor-pointer transition-all duration-150 ${
                        index === selectedIndex
                          ? 'bg-blue-50 border-blue-100'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectNote(result)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getMatchTypeIcon(result.matchType)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 
                              className="text-sm font-medium text-gray-900 truncate"
                              dangerouslySetInnerHTML={{ 
                                __html: result.matchType === 'title' ? result.matchHighlight : result.title 
                              }}
                            />
                            <div className="flex items-center space-x-2 text-xs text-gray-400 ml-2">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{formatDate(result.updated_at)}</span>
                            </div>
                          </div>
                          
                          {result.matchType === 'content' && (
                            <p 
                              className="text-sm text-gray-600 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: result.matchHighlight }}
                            />
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-3 text-xs text-gray-400">
                              <span className="capitalize flex items-center">
                                {result.matchType === 'title' && '📄 Title match'}
                                {result.matchType === 'content' && '📝 Content match'}
                                {result.matchType === 'tag' && '🏷️ Tag match'}
                              </span>
                            </div>
                            
                            {index === selectedIndex && (
                              <ArrowRightIcon className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer shortcuts */}
                {searchQuery && results.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Press Enter to open selected note</span>
                      <span>{selectedIndex + 1} of {results.length}</span>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
