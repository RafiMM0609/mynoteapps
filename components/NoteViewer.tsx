'use client'

import { useState } from 'react'
import { PencilIcon, EyeIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Note } from '../lib/supabase'

interface NoteViewerProps {
  note: Note
  onEdit: () => void
}

export default function NoteViewer({ note, onEdit }: NoteViewerProps) {
  const [viewMode, setViewMode] = useState<'raw' | 'preview'>('preview')

  const renderMarkdown = (content: string) => {
    try {
      const rawHtml = marked(content) as string
      return DOMPurify.sanitize(rawHtml)
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return content
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 truncate">
            {note.title || 'Untitled'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {formatDate(note.updated_at)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <EyeIcon className="h-4 w-4 mr-1 inline" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'raw'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Raw
            </button>
          </div>
          
          <button
            onClick={onEdit}
            className="btn-primary"
            title="Edit Note"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {note.content ? (
          <div className="p-6">
            {viewMode === 'preview' ? (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                {note.content}
              </pre>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-4">This note is empty</p>
              <button
                onClick={onEdit}
                className="btn-primary"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Start writing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
