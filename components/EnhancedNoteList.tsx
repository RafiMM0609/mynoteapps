'use client'

import { useState, useEffect } from 'react'
import { TrashIcon, DocumentTextIcon, ExclamationTriangleIcon, EyeIcon, LinkIcon } from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'
import { getUnlinkedNotes, getUserNotes } from '../lib/notes'

interface EnhancedNoteListProps {
  userId?: string
  notes?: Note[] // Optional pre-filtered notes
  selectedNote: Note | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  searchQuery?: string
  highlightMatches?: boolean
  showLinkedNotes?: boolean
}

interface DeleteConfirmationModalProps {
  isOpen: boolean
  note: Note | null
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmationModal({ isOpen, note, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  if (!isOpen || !note) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">
              Delete Note
            </h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-900">
              {note.title || 'Untitled'}
            </p>
            {note.content && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {note.content.substring(0, 100)}...
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Note
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedNoteList({ 
  userId,
  notes: providedNotes,
  selectedNote, 
  onSelectNote, 
  onDeleteNote, 
  searchQuery = '',
  highlightMatches = false,
  showLinkedNotes = false 
}: EnhancedNoteListProps) {
  const [notes, setNotes] = useState<Note[]>(providedNotes || [])
  const [loading, setLoading] = useState(!providedNotes) // Only show loading if we need to fetch notes
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    note: Note | null
  }>({
    isOpen: false,
    note: null
  })

  // Track whether we're using provided notes or fetching our own
  const usingProvidedNotes = !!providedNotes

  // Update notes when providedNotes changes
  useEffect(() => {
    if (providedNotes) {
      setNotes(providedNotes)
      setLoading(false)
    }
  }, [providedNotes])

  // Only fetch notes if userId is provided and no notes are provided
  useEffect(() => {
    if (userId && !providedNotes) {
      loadNotes()
    }
  }, [userId, showLinkedNotes, providedNotes])

  const loadNotes = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const fetchedNotes = showLinkedNotes 
        ? await getUserNotes(userId)
        : await getUnlinkedNotes(userId)
      setNotes(fetchedNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const highlightText = (text: string, query: string): string => {
    if (!query.trim() || !highlightMatches) return text
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded font-medium">$1</mark>')
  }

  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const title = (note.title || '').toLowerCase()
    const content = (note.content || '').toLowerCase()
    
    return title.includes(query) || content.includes(query)
  })

  const handleDeleteClick = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      note
    })
  }

  const handleDeleteConfirm = () => {
    if (deleteModal.note) {
      onDeleteNote(deleteModal.note.id)
      setDeleteModal({
        isOpen: false,
        note: null
      })
      // Only reload notes if we're managing our own notes (not using providedNotes)
      if (userId && !usingProvidedNotes) {
        loadNotes()
      }
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      note: null
    })
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading notes...</p>
      </div>
    )
  }

  if (filteredNotes.length === 0) {
    return (
      <div className="p-4 text-center">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">
          {searchQuery ? 'No notes found' : (showLinkedNotes ? 'No notes yet' : 'No unlinked notes')}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {searchQuery 
            ? 'Try different search terms' 
            : (showLinkedNotes 
              ? 'Create your first note to get started'
              : 'All notes are linked. Create a new note or unlink existing ones.'
            )
          }
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header with view toggle */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {showLinkedNotes ? 'All Notes' : 'Main Notes'}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
              </span>
              {!showLinkedNotes && (
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <EyeIcon className="w-3 h-3 mr-1" />
                  Unlinked only
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`
                  group relative p-3 mb-2 rounded-lg cursor-pointer transition-all duration-150
                  ${selectedNote?.id === note.id 
                    ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent hover:shadow-sm'
                  }
                `}
                onClick={() => onSelectNote(note)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center space-x-2">
                      <h3 
                        className="text-sm font-medium text-gray-900 truncate"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(note.title || 'Untitled', searchQuery)
                        }}
                      />
                      {note.is_folder && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Folder
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(note.updated_at)}
                    </p>
                    {note.content && (
                      <div 
                        className="text-xs text-gray-600 mt-2 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(truncateContent(note.content), searchQuery)
                        }}
                      />
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteClick(note, e)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-150"
                    title="Delete note"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        note={deleteModal.note}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  )
}
