'use client'

import { useState } from 'react'
import { PencilIcon, EyeIcon, TagIcon, LinkIcon } from '@heroicons/react/24/outline'
import type { Note, NoteLink, NoteTag } from '../lib/supabase'
import NoteLinking from './NoteLinking'
import NoteTags from './NoteTags'
import MarkdownPreview from './MarkdownPreview'

interface NoteViewerProps {
  note: Note
  onEdit: () => void
  // New props for linking and tagging
  allNotes: Note[]
  noteLinks: NoteLink[]
  noteTags: NoteTag[]
  allTags: NoteTag[]
  onCreateLink: (targetNoteId: string, linkType: 'reference' | 'embed') => void
  onRemoveLink: (linkId: string) => void
  onOpenLinkedNote?: (note: Note) => void
  onCreateTag: (name: string, color: string) => void
  onAddTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
}

export default function NoteViewer({ 
  note, 
  onEdit,
  allNotes,
  noteLinks,
  noteTags,
  allTags,
  onCreateLink,
  onRemoveLink,
  onOpenLinkedNote,
  onCreateTag,
  onAddTag,
  onRemoveTag
}: NoteViewerProps) {
  const [viewMode, setViewMode] = useState<'raw' | 'preview'>('preview')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true)

  const handleNoteClick = (clickedNote: Note) => {
    if (onOpenLinkedNote) {
      onOpenLinkedNote(clickedNote)
    }
  }

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar)
  }

  const toggleDesktopSidebar = () => {
    setShowDesktopSidebar(!showDesktopSidebar)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date available'
    
    try {
      const date = new Date(dateString)
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString)
        return 'Invalid date'
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC' // Add timezone to handle ISO strings properly
      })
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString)
      return dateString // Return the original string as fallback
    }
  }
  return (
    <div className="h-full flex flex-col md:flex-row bg-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header - Enhanced UX with better visual hierarchy */}
        <div className="sticky-header flex items-start justify-between px-4 lg:px-6 py-4 lg:py-5 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
          <div className="flex-1 min-w-0 mr-4">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate mb-2">
              {note.title || 'Untitled'}
            </h1>
            {/* <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="font-medium">Last updated: {formatDate(note.updated_at)}</span>
              </div>
            </div> */}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Desktop Links Toggle Button */}
            <button
              onClick={toggleDesktopSidebar}
              className={`hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showDesktopSidebar
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700'
              }`}
              title={showDesktopSidebar ? 'Hide Tags & Links' : 'Show Tags & Links'}
            >
              <LinkIcon className="h-4 w-4" />
              <span>Links</span>
            </button>

            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('preview')}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <EyeIcon className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'raw'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <span>Raw</span>
              </button>
            </div>
            
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm shadow-blue-200"
              title="Edit Note"
            >
              <PencilIcon className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Edit Note</span>
            </button>
          </div>
        </div>
        
        {/* Content - Enhanced Reading Experience */}
        <div className="flex-1 overflow-auto note-viewer-mobile lg:overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {note.content && note.content.trim() ? (
            <div className="px-6 py-8 lg:px-12 lg:py-10 pb-24 lg:pb-12 max-w-4xl mx-auto">
              {viewMode === 'preview' ? (
                <MarkdownPreview
                  content={note.content}
                  availableNotes={allNotes}
                  onNoteClick={handleNoteClick}
                  className="max-w-none prose-enhanced-reading"
                />
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm lg:text-base text-gray-700 leading-loose bg-gray-50 p-6 rounded-lg border overflow-x-auto">
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

      {/* Right Sidebar - Links and Tags */}
      <div className={`hidden md:block md:border-l border-gray-200 bg-gray-50 overflow-y-auto md:max-h-full transition-all duration-300 ${
        showDesktopSidebar ? 'md:w-80' : 'md:w-0'
      }`}>
        <div className={`p-4 space-y-6 pb-4 ${showDesktopSidebar ? 'block' : 'hidden'}`}>
          {/* Note Tags */}
          <NoteTags
            noteTags={noteTags}
            availableTags={allTags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            onCreateTag={onCreateTag}
          />
          
          {/* Note Linking */}
          <NoteLinking
            currentNote={note}
            availableNotes={allNotes}
            existingLinks={noteLinks}
            onCreateLink={onCreateLink}
            onRemoveLink={onRemoveLink}
            onOpenLinkedNote={onOpenLinkedNote}
          />
        </div>
      </div>
      
      {/* Mobile Bottom Sheet for Tags and Links */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 transition-transform duration-300 z-50 ${showMobileSidebar ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tags & Links</h3>
            <button
              onClick={toggleMobileSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <NoteTags
              noteTags={noteTags}
              availableTags={allTags}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              onCreateTag={onCreateTag}
            />
            
            <NoteLinking
              currentNote={note}
              availableNotes={allNotes}
              existingLinks={noteLinks}
              onCreateLink={onCreateLink}
              onRemoveLink={onRemoveLink}
              onOpenLinkedNote={onOpenLinkedNote}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Action Button
      <button
        onClick={toggleMobileSidebar}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all duration-200"
      >
        <TagIcon className="w-6 h-6" />
      </button> */}

      {/* Desktop Floating Action Button (when sidebar is hidden) */}
      {!showDesktopSidebar && (
        <button
          onClick={toggleDesktopSidebar}
          className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg items-center justify-center z-40 transition-all duration-200"
          title="Show Tags & Links"
        >
          <LinkIcon className="w-6 h-6" />
        </button>
      )}
      
      {/* Mobile Overlay */}
      {showMobileSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileSidebar}
        />
      )}
    </div>
  )
}
