'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Note } from '@/lib/notes'
import { migrateContentToMarkdown, markdownToHtml } from '@/lib/markdown-converter'
import Tooltip from './Tooltip'

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
)

interface MarkdownEditorProps {
  note: Note | null
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

export default function MarkdownEditor({ note, onSave, onCancel }: MarkdownEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [renderedContent, setRenderedContent] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      // Convert HTML content to Markdown if needed
      const markdownContent = migrateContentToMarkdown(note.content)
      setContent(markdownContent)
    } else {
      setTitle('')
      setContent('')
    }
    
    // Focus on title input when creating new note
    if (!note && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [note])

  // Update rendered content when content changes
  useEffect(() => {
    const renderContent = async () => {
      if (content) {
        try {
          const html = await markdownToHtml(content)
          setRenderedContent(html)
        } catch (error) {
          console.error('Error rendering markdown:', error)
          setRenderedContent(content)
        }
      } else {
        setRenderedContent('<p class="text-gray-400">Start typing to see preview...</p>')
      }
    }
    
    renderContent()
  }, [content])

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your note')
      return
    }
    
    setIsSaving(true)
    try {
      await onSave(title, content)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault()
          handleSave()
          break
        case '/':
          e.preventDefault()
          setShowShortcuts(true)
          break
        case 'Enter':
          e.preventDefault()
          if (e.shiftKey) {
            setIsFullscreen(!isFullscreen)
          } else {
            setIsPreview(!isPreview)
          }
          break
      }
    }
    
    if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false)
      }
    }
    
    if (e.key === 'F11') {
      e.preventDefault()
      setIsFullscreen(!isFullscreen)
    }
  }

  return (
    <div 
      className={`flex-1 flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 border-b border-gray-200 gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 flex-1">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-base sm:text-xl font-semibold text-gray-800 bg-transparent border-none outline-none placeholder-gray-400 w-full"
          />
        </div>
        
        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
          <div className="flex items-center space-x-1">
            <Tooltip content="Toggle Preview (Ctrl+Enter)">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm transition-colors touch-manipulation ${
                  isPreview 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
            </Tooltip>
            
            <Tooltip content={isFullscreen ? "Exit Fullscreen (Esc/F11)" : "Fullscreen (F11)"}>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                {isFullscreen ? (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </Tooltip>
            
            <Tooltip content="Keyboard Shortcuts (Ctrl+/)">
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-1 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </Tooltip>
          </div>
          
          <button
            onClick={onCancel}
            className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors touch-manipulation"
            disabled={isSaving}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-800 text-white px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-gray-700 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (          <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
            <div 
              className="markdown-preview prose prose-gray max-w-none text-sm sm:text-base prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </div>
        ) : (
          <div className="flex-1 h-full">            <MDEditor
              value={content}
              onChange={(value) => setContent(value || '')}
              preview="edit"
              hideToolbar={false}
              height={isFullscreen ? 600 : 400}
              data-color-mode="light"
              className="markdown-editor"
            />
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Save note</span>
                <span className="text-gray-500">Ctrl+S</span>
              </div>
              <div className="flex justify-between">
                <span>Toggle preview</span>
                <span className="text-gray-500">Ctrl+Enter</span>
              </div>
              <div className="flex justify-between">
                <span>Fullscreen</span>
                <span className="text-gray-500">F11 or Ctrl+Shift+Enter</span>
              </div>
              <div className="flex justify-between">
                <span>Show shortcuts</span>
                <span className="text-gray-500">Ctrl+/</span>
              </div>
              <div className="flex justify-between">
                <span>Exit fullscreen</span>
                <span className="text-gray-500">Esc</span>
              </div>
              <hr className="my-2" />
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Markdown Formatting:</p>
                <p>**bold** - Bold text</p>
                <p>*italic* - Italic text</p>
                <p># Header - H1 Header</p>
                <p>## Header - H2 Header</p>
                <p>- Item - Bullet list</p>
                <p>`code` - Inline code</p>
                <p>```code``` - Code block</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
