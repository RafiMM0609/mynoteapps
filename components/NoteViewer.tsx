'use client'

import { useState, useEffect } from 'react'
import { Note } from '@/app/page'
import { detectContentFormat, markdownToHtml } from '@/lib/markdown-converter'

interface NoteViewerProps {
  note: Note
  onEdit: () => void
}

export default function NoteViewer({ note, onEdit }: NoteViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [renderedContent, setRenderedContent] = useState('')
  
  useEffect(() => {
    const renderContent = async () => {
      if (note.content) {
        const format = detectContentFormat(note.content)
        if (format === 'markdown') {
          const html = await markdownToHtml(note.content)
          setRenderedContent(html)
        } else {
          setRenderedContent(note.content)
        }
      } else {
        setRenderedContent('')
      }
    }
    
    renderContent()
  }, [note.content])
    const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getWordCount = (content: string) => {
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return textContent ? textContent.split(' ').length : 0
  }
  const getReadingTime = (content: string) => {
    const wordCount = getWordCount(content)
    const wordsPerMinute = 200
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return minutes === 1 ? '1 min read' : `${minutes} min read`
  }

  return (
    <div className={`flex-1 flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
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
              {note.content && (
                <>
                  <span>•</span>
                  <span>{getWordCount(note.content)} words</span>
                  <span>•</span>
                  <span>{getReadingTime(note.content)}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            
            <button
              onClick={onEdit}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium touch-manipulation w-full sm:w-auto flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Note</span>
            </button>
          </div>
        </div>
      </div>      {/* Content */}      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto p-4 sm:p-6 ${isFullscreen ? 'max-w-4xl' : 'max-w-4xl'} overflow-x-hidden`}>
          {renderedContent ? (
            <div 
              className="prose prose-gray max-w-none note-content text-sm sm:text-base prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">This note is empty</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">Click &quot;Edit Note&quot; to add some content</p>
              <button
                onClick={onEdit}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm touch-manipulation w-full sm:w-auto flex items-center space-x-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Start Writing</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
