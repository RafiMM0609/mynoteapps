'use client'

import { useState } from 'react'
import SearchBar from './SearchBar'
import EnhancedNoteList from './EnhancedNoteList'
import AdvancedSearchFilters, { SearchFilters } from './AdvancedSearchFilters'
import { useNoteSearch } from '../hooks/useNoteSearch'
import type { Note } from '../lib/supabase'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

interface SearchableNoteListProps {
  notes: Note[]
  selectedNote: Note | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
}

interface SearchOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  options: any
  onOptionsChange: (options: any) => void
}

function SearchOptionsModal({ isOpen, onClose, options, onOptionsChange }: SearchOptionsModalProps) {
  if (!isOpen) return null

  const handleOptionChange = (key: string, value: boolean) => {
    onOptionsChange({
      ...options,
      [key]: value
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Options</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Search in titles</label>
            <input
              type="checkbox"
              checked={options.searchTitle}
              onChange={(e) => handleOptionChange('searchTitle', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Search in content</label>
            <input
              type="checkbox"
              checked={options.searchContent}
              onChange={(e) => handleOptionChange('searchContent', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Case sensitive</label>
            <input
              type="checkbox"
              checked={options.caseSensitive}
              onChange={(e) => handleOptionChange('caseSensitive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Exact match</label>
            <input
              type="checkbox"
              checked={options.exactMatch}
              onChange={(e) => handleOptionChange('exactMatch', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SearchableNoteList({ 
  notes, 
  selectedNote, 
  onSelectNote, 
  onDeleteNote 
}: SearchableNoteListProps) {
  const [searchOptions, setSearchOptions] = useState({
    searchTitle: true,
    searchContent: true,
    caseSensitive: false,
    exactMatch: false
  })
  
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    dateRange: 'all',
    tags: [],
    sortBy: 'updated',
    sortOrder: 'desc'
  })
  
  const [showOptions, setShowOptions] = useState(false)

  const { 
    searchQuery, 
    setSearchQuery, 
    searchResult 
  } = useNoteSearch(notes, searchOptions, searchFilters)

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchQuery}
              value={searchQuery}
              placeholder="Search notes by title or content..."
              autoFocus={true}
            />
          </div>
          <button
            onClick={() => setShowOptions(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
            title="Search options"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
        
        {searchQuery && (
          <div className="mt-2 text-xs text-gray-500">
            Found {searchResult.matchCount} of {searchResult.totalCount} notes
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <AdvancedSearchFilters
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        availableTags={[]} // This would come from props if tags are implemented
        isVisible={false}
      />

      {/* Notes List */}
      <div className="flex-1 overflow-hidden">
        <EnhancedNoteList
          notes={searchResult.filteredNotes}
          selectedNote={selectedNote}
          onSelectNote={onSelectNote}
          onDeleteNote={onDeleteNote}
          searchQuery={searchQuery}
          highlightMatches={true}
        />
      </div>

      {/* Empty State for Search */}
      {searchQuery && searchResult.filteredNotes.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No notes found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search terms or filters
            </p>
          </div>
        </div>
      )}

      {/* Search Options Modal */}
      <SearchOptionsModal
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        options={searchOptions}
        onOptionsChange={setSearchOptions}
      />
    </div>
  )
}
