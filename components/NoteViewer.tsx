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
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {note.title || 'Untitled Note'}
            </h1>
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span>Created: {formatDate(note.created_at)}</span>
              {note.updated_at !== note.created_at && (
                <span>Updated: {formatDate(note.updated_at)}</span>
              )}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Edit Note
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {note.content ? (
            <div 
              className="prose prose-gray max-w-none note-content"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>              <h3 className="text-lg font-medium text-gray-600 mb-2">This note is empty</h3>
              <p className="text-gray-500 mb-4">Click &quot;Edit Note&quot; to add some content</p>
              <button
                onClick={onEdit}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
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
