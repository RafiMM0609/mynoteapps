'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckIcon, XMarkIcon, EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Note } from '../lib/supabase'
import SlashCommandDropdown from './SlashCommandDropdown'

interface NoteEditorProps {
  note: Note
  onSave: (noteId: string, title: string, content: string) => void
  onCancel: () => void
}

export default function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [hasChanges, setHasChanges] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  
  // Slash command states
  const [showSlashDropdown, setShowSlashDropdown] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [slashStartPos, setSlashStartPos] = useState(0)
  useEffect(() => {
    const hasAnyChanges = title !== note.title || content !== note.content
    setHasChanges(hasAnyChanges)
  }, [title, content, note.title, note.content])

  // Close slash dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSlashDropdown && contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setShowSlashDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSlashDropdown])

  const handleSave = () => {
    onSave(note.id, title, content)
    setHasChanges(false)
  }

  const handleCancel = () => {
    if (hasChanges && !confirm('Are you sure you want to discard your changes?')) {
      return
    }
    onCancel()
  }

  const renderMarkdown = (text: string) => {
    try {
      const rawHtml = marked(text) as string
      return DOMPurify.sanitize(rawHtml)
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return text
    }
  }
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = contentRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end)
    
    setContent(newContent)
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }
  // Calculate dropdown position based on cursor
  const calculateDropdownPosition = (textarea: HTMLTextAreaElement, cursorPos: number) => {
    const textBeforeCursor = content.substring(0, cursorPos)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length - 1
    const currentColumn = lines[lines.length - 1].length

    const rect = textarea.getBoundingClientRect()
    const lineHeight = 20 // Approximate line height
    const charWidth = 8 // Approximate character width

    // Get scroll position
    const scrollTop = textarea.scrollTop
    const scrollLeft = textarea.scrollLeft

    return {
      top: rect.top + (currentLine * lineHeight) + lineHeight + 25 - scrollTop,
      left: Math.min(rect.left + (currentColumn * charWidth) + 10 - scrollLeft, window.innerWidth - 320) // Prevent overflow
    }
  }

  // Handle slash command detection
  const handleSlashCommand = (value: string, cursorPos: number) => {
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
    
    if (lastSlashIndex === -1) {
      setShowSlashDropdown(false)
      return
    }

    // Check if the slash is at the beginning of a line or after whitespace
    const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : '\n'
    const isValidSlashPosition = charBeforeSlash === '\n' || charBeforeSlash === ' ' || charBeforeSlash === '\t'

    if (!isValidSlashPosition) {
      setShowSlashDropdown(false)
      return
    }

    const queryAfterSlash = textBeforeCursor.substring(lastSlashIndex + 1)
    
    // Don't show dropdown if there's a space after the slash query
    if (queryAfterSlash.includes(' ')) {
      setShowSlashDropdown(false)
      return
    }

    setSlashQuery(queryAfterSlash)
    setSlashStartPos(lastSlashIndex)
    
    if (contentRef.current) {
      const position = calculateDropdownPosition(contentRef.current, cursorPos)
      setSlashPosition(position)
      setShowSlashDropdown(true)
    }
  }

  // Handle slash command selection
  const handleSlashCommandSelect = (command: any) => {
    const textarea = contentRef.current
    if (!textarea) return

    const { before, after } = command.action()
    
    // Remove the slash and query text
    const beforeSlash = content.substring(0, slashStartPos)
    const afterCursor = content.substring(textarea.selectionStart)
    
    const newContent = beforeSlash + before + after + afterCursor
    setContent(newContent)
    
    // Position cursor
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = slashStartPos + before.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
    
    setShowSlashDropdown(false)
    setSlashQuery('')
  }

  // Handle content change with slash command detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart
    
    setContent(newValue)
    handleSlashCommand(newValue, cursorPos)
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If slash dropdown is open, let it handle navigation keys
    if (showSlashDropdown && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      return // Let SlashCommandDropdown handle these keys
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault()
          handleSave()
          break
        case 'b':
          e.preventDefault()
          insertMarkdown('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertMarkdown('*', '*')
          break
      }
    }

    // Close slash dropdown on other keys
    if (showSlashDropdown && !['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      if (e.key === 'Backspace') {
        // Handle backspace - might need to close dropdown
        const textarea = e.target as HTMLTextAreaElement
        const cursorPos = textarea.selectionStart
        if (cursorPos <= slashStartPos) {
          setShowSlashDropdown(false)
        }
      }
    }
  }
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Slash Command Dropdown */}
      <SlashCommandDropdown
        isVisible={showSlashDropdown}
        position={slashPosition}
        onSelect={handleSlashCommandSelect}
        onClose={() => setShowSlashDropdown(false)}
        searchQuery={slashQuery}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex-1 min-w-0 mr-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-semibold text-gray-900 border-none focus:outline-none bg-transparent"
            placeholder="Note title..."
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'edit'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PencilSquareIcon className="h-4 w-4 mr-1 inline" />
              Edit
            </button>
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
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'split'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Split
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleCancel}
            className="btn-secondary"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => insertMarkdown('**', '**')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => insertMarkdown('*', '*')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors italic"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          onClick={() => insertMarkdown('# ')}
          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => insertMarkdown('## ')}
          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => insertMarkdown('- ')}
          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => insertMarkdown('`', '`')}
          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors font-mono"
          title="Inline Code"
        >
          {'</>'}
        </button>
        <button
          onClick={() => insertMarkdown('```\n', '\n```')}
          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Code Block"
        >
          Code
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex">
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>            <textarea
              ref={contentRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="editor-textarea h-full resize-none"
              placeholder="Start writing your note... (Type '/' for commands)"
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto`}>
            <div className="p-6">
              {content ? (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              ) : (
                <p className="text-gray-500 italic">Nothing to preview yet...</p>
              )}
            </div>
          </div>
        )}
      </div>      {/* Status bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>{content.length} characters</span>
          <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
          <span className="text-blue-600">• Type "/" for commands</span>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && <span className="text-orange-600">• Unsaved changes</span>}
          <span>Ctrl+S to save</span>
        </div>
      </div>
    </div>
  )
}
