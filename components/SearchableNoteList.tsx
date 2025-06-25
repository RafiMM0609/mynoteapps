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
  onOpenSearchModal?: () => void // Add callback for opening search modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass max-w-md w-full p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            🎯 Search Options
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <label className="text-sm font-medium text-gray-700">Search in titles</label>
            </div>
            <input
              type="checkbox"
              checked={options.searchTitle}
              onChange={(e) => handleOptionChange('searchTitle', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors duration-200"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <label className="text-sm font-medium text-gray-700">Search in content</label>
            </div>
            <input
              type="checkbox"
              checked={options.searchContent}
              onChange={(e) => handleOptionChange('searchContent', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors duration-200"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <label className="text-sm font-medium text-gray-700">Case sensitive</label>
            </div>
            <input
              type="checkbox"
              checked={options.caseSensitive}
              onChange={(e) => handleOptionChange('caseSensitive', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors duration-200"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <label className="text-sm font-medium text-gray-700">Exact match</label>
            </div>
            <input
              type="checkbox"
              checked={options.exactMatch}
              onChange={(e) => handleOptionChange('exactMatch', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors duration-200"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Apply Settings ✨
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
  onDeleteNote,
  onOpenSearchModal
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
      {/* Enhanced Search Header */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <SearchBar
              onSearch={setSearchQuery}
              value={searchQuery}
              placeholder="🔍 Search your magical notes..."
              autoFocus={true}
              onOpenModal={onOpenSearchModal}
            />
          </div>
          <button
            onClick={() => setShowOptions(true)}
            className={`
              p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95
              ${showOptions 
                ? 'bg-primary-100 text-primary-600 shadow-lg' 
                : 'bg-white/70 hover:bg-white text-gray-500 hover:text-gray-700 shadow-md hover:shadow-lg'
              }
              border border-gray-200/50 backdrop-blur-sm
            `}
            title="Search options & filters"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
        
        {searchQuery && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                {searchResult.matchCount} found
              </div>
              <div className="text-xs text-gray-500">
                of {searchResult.totalCount} total notes
              </div>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:underline"
            >
              Clear search
            </button>
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

      {/* Enhanced Empty State for Search */}
      {searchQuery && searchResult.filteredNotes.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="text-4xl mb-2">🔍</div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No notes found</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              We couldn't find any notes matching "<span className="font-semibold text-gray-700">{searchQuery}</span>"
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <p>💡 Try adjusting your search terms</p>
              <p>⚙️ Or modify your search filters</p>
            </div>
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
