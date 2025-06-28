'use client'

import { useState } from 'react'
import { ChevronLeftIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'

interface MobileNoteViewerProps {
  note: Note
  onBack: () => void
  onEdit?: () => void
  isEditing?: boolean
}

export default function MobileNoteViewer({ 
  note, 
  onBack, 
  onEdit, 
  isEditing = false 
}: MobileNoteViewerProps) {
  const [showFullContent, setShowFullContent] = useState(false)

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

  const toggleContent = () => {
    setShowFullContent(!showFullContent)
  }

  const getContentPreview = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {note.title || 'Untitled'}
              </h1>
            </div>
          </div>
          
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200"
            >
              {isEditing ? (
                <EyeIcon className="h-6 w-6" />
              ) : (
                <PencilIcon className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
        
        {/* Note metadata */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Last updated</span>
            <span className="font-medium">{formatDate(note.updated_at)}</span>
          </div>
          {note.is_folder && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                📁 Folder
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {note.content ? (
            <div className="space-y-4">
              <div 
                className={`text-base leading-relaxed text-gray-700 whitespace-pre-wrap ${
                  !showFullContent && note.content.length > 300 ? 'line-clamp-6' : ''
                }`}
              >
                {showFullContent ? note.content : getContentPreview(note.content)}
              </div>
              
              {note.content.length > 300 && (
                <button
                  onClick={toggleContent}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  {showFullContent ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">This note is empty</p>
              <p className="text-gray-400 text-sm mt-2">
                {onEdit ? 'Tap edit to add some content' : 'No content to display'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding for better scrolling */}
      <div className="h-8 bg-white"></div>
    </div>
  )
}
