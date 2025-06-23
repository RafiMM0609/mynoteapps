'use client'

import { useState, useEffect } from 'react'
import { 
  LinkIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import type { Note, NoteLink } from '../lib/supabase'

interface NoteLinkingProps {
  currentNote: Note
  availableNotes: Note[]
  existingLinks: NoteLink[]
  onCreateLink: (targetNoteId: string, linkType: 'reference' | 'embed') => void
  onRemoveLink: (linkId: string) => void
  onOpenLinkedNote?: (note: Note) => void
}

export default function NoteLinking({ 
  currentNote, 
  availableNotes, 
  existingLinks, 
  onCreateLink, 
  onRemoveLink,
  onOpenLinkedNote
}: NoteLinkingProps) {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])

  useEffect(() => {
    // Filter notes based on search query and exclude current note and already linked notes
    const linkedNoteIds = new Set(existingLinks.map(link => link.target_note_id))
      let filtered = availableNotes.filter(note => 
      note.id !== currentNote.id && 
      !linkedNoteIds.has(note.id) &&
      ((note.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
       (note.content?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
    )

    setFilteredNotes(filtered.slice(0, 10)) // Limit to 10 results
  }, [searchQuery, availableNotes, currentNote.id, existingLinks])

  const handleCreateLink = (targetNote: Note, linkType: 'reference' | 'embed') => {
    onCreateLink(targetNote.id, linkType)
    setShowLinkModal(false)
    setSearchQuery('')
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Linked Notes ({existingLinks.length})
        </h3>
        <button
          onClick={() => setShowLinkModal(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
        >
          <LinkIcon className="w-3 h-3" />
          Link Note
        </button>
      </div>

      {/* Existing Links */}
      <div className="space-y-2">
        {existingLinks.map((link) => {
          const targetNote = availableNotes.find(note => note.id === link.target_note_id)
          if (!targetNote) return null

          return (
            <div
              key={link.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md group"
            >
              <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {targetNote.title || 'Untitled'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {link.link_type === 'embed' ? 'Embedded' : 'Referenced'}
                </div>
              </div>              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onOpenLinkedNote && targetNote && onOpenLinkedNote(targetNote)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="Open note"
                  disabled={!onOpenLinkedNote}
                >
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemoveLink(link.id)}
                  className="p-1 text-red-400 hover:text-red-600 rounded"
                  title="Remove link"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}

        {existingLinks.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No linked notes yet
          </p>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Link Note
              </h3>
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setSearchQuery('')
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md cursor-pointer group"
                  >
                    <div className="flex items-start gap-2">
                      <DocumentTextIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {note.title || 'Untitled'}
                        </div>
                        {note.content && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {note.content.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Link Actions */}
                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCreateLink(note, 'reference')}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      >
                        Reference
                      </button>
                      <button
                        onClick={() => handleCreateLink(note, 'embed')}
                        className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                      >
                        Embed
                      </button>
                    </div>
                  </div>
                ))}

                {searchQuery && filteredNotes.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notes found</p>
                  </div>
                )}

                {!searchQuery && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Search for notes to link</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
