'use client'

import { useState } from 'react'
import { TrashIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'

interface NoteListProps {
  notes: Note[]
  selectedNote: Note | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
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

export default function NoteList({ notes, selectedNote, onSelectNote, onDeleteNote }: NoteListProps) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    note: Note | null
  }>({
    isOpen: false,
    note: null
  })

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

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

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
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      note: null
    })
  }

  if (notes.length === 0) {
    return (
      <div className="p-4 text-center">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No notes yet</p>
        <p className="text-sm text-gray-400 mt-1">Create your first note to get started</p>
      </div>
    )
  }
  return (
    <>
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="p-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`
                group relative p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-150
                ${selectedNote?.id === note.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                }
              `}
              onClick={() => onSelectNote(note)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-8">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {note.title || 'Untitled'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(note.updated_at)}
                  </p>
                  {note.content && (
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      {truncateContent(note.content)}
                    </p>
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
