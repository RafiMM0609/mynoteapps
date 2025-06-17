'use client'

import { TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'

interface NoteListProps {
  notes: Note[]
  selectedNote: Note | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
}

export default function NoteList({ notes, selectedNote, onSelectNote, onDeleteNote }: NoteListProps) {
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

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
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
              <div className="flex-1 min-w-0">
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
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteNote(note.id)
                }}
                className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-red-500 transition-all duration-150"
                title="Delete note"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
