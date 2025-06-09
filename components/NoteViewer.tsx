'use client'

import { Note } from '@/app/page'

interface NoteViewerProps {
  note: Note
  onEdit: () => void
}

export default function NoteViewer({ note, onEdit }: NoteViewerProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
              {note.title || 'Untitled Note'}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
              <span>Created: {formatDate(note.created_at)}</span>
              {note.updated_at !== note.created_at && (
                <span>Updated: {formatDate(note.updated_at)}</span>
              )}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium touch-manipulation w-full sm:w-auto"
          >
            Edit Note
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {note.content ? (
            <div 
              className="prose prose-gray max-w-none note-content text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">This note is empty</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">Click "Edit Note" to add some content</p>
              <button
                onClick={onEdit}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm touch-manipulation w-full sm:w-auto"
              >
                Start Writing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
