import { useState } from 'react'
import type { Note } from '@/app/page'

interface NoteListProps {
  notes: Note[]
  selectedNote: Note | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  isLoading: boolean
}

export default function NoteList({ 
  notes, 
  selectedNote, 
  onSelectNote, 
  onDeleteNote, 
  isLoading 
}: NoteListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    // Remove HTML tags for preview
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent
  }

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (notes.length === 0 && !searchQuery) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No notes yet. Create your first note!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Sort Controls */}
      <div className="p-3 border-b border-gray-200 space-y-3">        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full focus-visible"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'title')}
            className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="title">Title A-Z</option>
          </select>
          
          <span className="text-xs text-gray-500">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </span>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500 text-sm">
              {searchQuery ? `No notes found for "${searchQuery}"` : 'No notes found'}
            </p>
          </div>
        ) : (
          <div className="p-2">            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`note-card-enhanced cursor-pointer group touch-target ${
                  selectedNote?.id === note.id ? 'selected' : ''
                }`}
                onClick={() => onSelectNote(note)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-800 truncate text-sm">
                        {note.title || 'Untitled'}
                      </h3>
                      {selectedNote?.id === note.id && (
                        <span className="status-dot status-success" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatDate(note.updated_at)}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {truncateContent(note.content)}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Are you sure you want to delete this note?')) {
                        onDeleteNote(note.id)
                      }
                    }}
                    className="opacity-75 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg touch-target flex items-center justify-center smooth-transition"
                    title="Delete note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
