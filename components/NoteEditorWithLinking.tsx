'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'
import NoteEditor from './NoteEditor_new'
import NoteLinkingSidebar from './NoteLinkingSidebar'
import MarkdownPreview from './MarkdownPreview'

interface NoteEditorWithLinkingProps {
  initialNote: Note
  allNotes: Note[]
  onSave: (noteId: string, title: string, content: string) => void
  onCancel: () => void
  onNoteClick?: (note: Note) => void
  onCreateNewNote?: (title: string) => void
}

export default function NoteEditorWithLinking({
  initialNote,
  allNotes,
  onSave,
  onCancel,
  onNoteClick,
  onCreateNewNote
}: NoteEditorWithLinkingProps) {
  const [note, setNote] = useState(initialNote)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLinkingSidebar, setShowLinkingSidebar] = useState(true)

  // Update note when initialNote changes
  useEffect(() => {
    setNote(initialNote)
  }, [initialNote])

  const handleSave = (noteId: string, title: string, content: string) => {
    // Update local state
    setNote(prev => ({ ...prev, title, content }))
    // Call parent save handler
    onSave(noteId, title, content)
  }

  const handleNoteClick = (clickedNote: Note) => {
    if (onNoteClick) {
      onNoteClick(clickedNote)
    }
  }

  const handleCreateNewNote = (title: string) => {
    if (onCreateNewNote) {
      onCreateNewNote(title)
    }
  }

  return (
    <div className="h-full flex bg-white dark:bg-gray-900">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-150 ${
                isPreviewMode
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {isPreviewMode ? 'Edit' : 'Preview'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLinkingSidebar(!showLinkingSidebar)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-150"
              title={showLinkingSidebar ? "Hide links sidebar" : "Show links sidebar"}
            >
              {showLinkingSidebar ? (
                <ChevronRightIcon className="w-5 h-5" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Editor or Preview */}
        <div className="flex-1 flex">
          {isPreviewMode ? (
            <div className="flex-1 p-6 overflow-auto">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {note.title || 'Untitled'}
              </h1>
              <MarkdownPreview
                content={note.content || ''}
                availableNotes={allNotes}
                onNoteClick={handleNoteClick}
                className="max-w-none"
              />
            </div>
          ) : (
            <NoteEditor
              note={note}
              onSave={handleSave}
              onCancel={onCancel}
              availableNotes={allNotes}
              onNoteClick={handleNoteClick}
              onCreateNewNote={handleCreateNewNote}
            />
          )}
        </div>
      </div>

      {/* Note Linking Sidebar */}
      {showLinkingSidebar && (
        <NoteLinkingSidebar
          currentNote={note}
          allNotes={allNotes}
          onNoteClick={handleNoteClick}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}
    </div>
  )
}
