'use client'

import { useState, useEffect, useRef } from 'react'
import type { Note } from '@/app/page'
import Tooltip from './Tooltip'
import KeyboardShortcuts from './KeyboardShortcuts'

interface NoteEditorProps {
  note: Note | null
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

export default function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSplitView, setIsSplitView] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      // Update editor content when note changes
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content
      }
    } else {
      setTitle('')
      setContent('')
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
    }
    
    // Focus on title input when creating new note
    if (!note && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [note])

  // Update content state when editor content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML
      setContent(htmlContent)
      updateActiveFormats()
    }
  }

  // Check current formatting and update active formats state
  const updateActiveFormats = () => {
    const selection = window.getSelection()
    if (!selection || !editorRef.current) return

    const formats = new Set<string>()
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      let element = range.startContainer as Node
      
      // Traverse up the DOM tree to find formatting elements
      while (element && element !== editorRef.current) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          const tagName = (element as Element).tagName.toLowerCase()
          switch (tagName) {
            case 'strong':
            case 'b':
              formats.add('bold')
              break
            case 'em':
            case 'i':
              formats.add('italic')
              break
            case 'h1':
              formats.add('h1')
              break
            case 'h2':
              formats.add('h2')
              break
            case 'h3':
              formats.add('h3')
              break
            case 'code':
              formats.add('code')
              break
            case 'pre':
              formats.add('pre')
              break
            case 'ul':
              formats.add('ul')
              break
            case 'ol':
              formats.add('ol')
              break
          }
        }
        element = element.parentNode!
      }
    }
    
    setActiveFormats(formats)
  }  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          toggleFormatting('bold')
          break
        case 'i':
          e.preventDefault()
          toggleFormatting('italic')
          break
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
            setIsSplitView(!isSplitView)
          } else {
            setIsPreview(!isPreview)
          }
          break
      }
    }
  }

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
  
  // Toggle formatting with active state management
  const toggleFormatting = (format: string) => {
    if (!editorRef.current) return

    editorRef.current.focus()
    
    // Check if format is currently active
    const isActive = activeFormats.has(format)
    
    if (format === 'bold' || format === 'italic') {
      // Use execCommand for better support with toggle
      if (format === 'bold') {
        document.execCommand('bold', false, '')
      } else {
        document.execCommand('italic', false, '')
      }
      handleContentChange()
      return
    }

    // For block elements, remove if active, add if not
    if (isActive && ['h1', 'h2', 'h3', 'pre'].includes(format)) {
      // Convert back to paragraph
      document.execCommand('formatBlock', false, 'p')
      handleContentChange()
      return
    }

    // Apply new formatting
    insertFormatting(format)
  }
  
  const insertFormatting = (tag: string) => {
    if (!editorRef.current) return

    editorRef.current.focus()
    
    const selection = window.getSelection()
    if (!selection) return

    // For bold and italic, use execCommand for better browser support
    if (tag === 'bold') {
      document.execCommand('bold', false, '')
      handleContentChange()
      return
    }
    
    if (tag === 'italic') {
      document.execCommand('italic', false, '')
      handleContentChange()
      return
    }

    // For other elements, create them manually
    let range: Range
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0)
    } else {
      range = document.createRange()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
    }

    const selectedText = range.toString()
    let element: HTMLElement
    
    switch (tag) {
      case 'h1':
        element = document.createElement('h1')
        element.textContent = selectedText || 'Heading 1'
        break
      case 'h2':
        element = document.createElement('h2')
        element.textContent = selectedText || 'Heading 2'
        break
      case 'h3':
        element = document.createElement('h3')
        element.textContent = selectedText || 'Heading 3'
        break
      case 'p':
        element = document.createElement('p')
        element.innerHTML = selectedText || 'Paragraph text'
        break
      case 'ul':
        element = document.createElement('ul')
        const li = document.createElement('li')
        li.textContent = selectedText || 'List item'
        element.appendChild(li)
        break
      case 'ol':
        element = document.createElement('ol')
        const liOl = document.createElement('li')
        liOl.textContent = selectedText || 'List item'
        element.appendChild(liOl)
        break
      case 'code':
        element = document.createElement('code')
        element.textContent = selectedText || 'code'
        break
      case 'pre':
        element = document.createElement('pre')
        const codeEl = document.createElement('code')
        codeEl.textContent = selectedText || 'code block'
        element.appendChild(codeEl)
        break
      default:
        return
    }

    try {
      // Delete selected content and insert new element
      range.deleteContents()
      range.insertNode(element)
      
      // Add some spacing after block elements
      if (['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'pre'].includes(tag)) {
        const br = document.createElement('br')
        range.setStartAfter(element)
        range.insertNode(br)
        
        // Position cursor after the break
        const newRange = document.createRange()
        newRange.setStartAfter(br)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // For inline elements, position cursor after the element
        const newRange = document.createRange()
        newRange.setStartAfter(element)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    } catch (error) {
      console.error('Error inserting element:', error)
    }
    
    // Update content state
    handleContentChange()
  }
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-0">
        <div className="flex items-center space-x-3 flex-1">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-lg sm:text-xl font-semibold text-gray-800 bg-transparent border-none outline-none placeholder-gray-400 w-full"
          />
        </div>        <div className="flex items-center justify-end space-x-2">
          <div className="flex items-center space-x-1">
            <Tooltip content="Toggle Preview (Ctrl+Enter)">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`px-3 py-2 rounded text-sm transition-colors touch-manipulation ${
                  isPreview 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
            </Tooltip>
            
            <Tooltip content="Split View (Ctrl+Shift+Enter)">
              <button
                onClick={() => setIsSplitView(!isSplitView)}
                className={`px-3 py-2 rounded text-sm transition-colors touch-manipulation ${
                  isSplitView 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Split
              </button>
            </Tooltip>
            
            <Tooltip content="Keyboard Shortcuts (Ctrl+/)">
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </Tooltip>
          </div>
          
          <button
            onClick={onCancel}
            className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors touch-manipulation"
            disabled={isSaving}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-800 text-white px-3 sm:px-4 py-2 rounded hover:bg-gray-700 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>      {(!isPreview || isSplitView) && (
        /* Formatting Toolbar */
        <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <div className="flex items-center space-x-1">
            <Tooltip content="Bold (Ctrl+B)">
              <button
                onClick={() => toggleFormatting('bold')}
                className={`p-2 sm:p-2 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('bold')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <strong className="text-sm">B</strong>
              </button>
            </Tooltip>
            <Tooltip content="Italic (Ctrl+I)">
              <button
                onClick={() => toggleFormatting('italic')}
                className={`p-2 sm:p-2 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('italic')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <em className="text-sm">I</em>
              </button>
            </Tooltip>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <div className="flex items-center space-x-1">
            <Tooltip content="Heading 1">
              <button
                onClick={() => toggleFormatting('h1')}
                className={`p-2 rounded text-xs touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('h1')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                H1
              </button>
            </Tooltip>
            <Tooltip content="Heading 2">
              <button
                onClick={() => toggleFormatting('h2')}
                className={`p-2 rounded text-xs touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('h2')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                H2
              </button>
            </Tooltip>
            <Tooltip content="Heading 3">
              <button
                onClick={() => toggleFormatting('h3')}
                className={`p-2 rounded text-xs touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('h3')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                H3
              </button>
            </Tooltip>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <div className="flex items-center space-x-1">
            <Tooltip content="Bullet List">
              <button
                onClick={() => toggleFormatting('ul')}
                className={`p-2 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('ul')
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </Tooltip>
            <Tooltip content="Numbered List">
              <button
                onClick={() => toggleFormatting('ol')}
                className={`p-2 rounded text-xs touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('ol')
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                1.
              </button>
            </Tooltip>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <div className="flex items-center space-x-1">
            <Tooltip content="Inline Code">
              <button
                onClick={() => toggleFormatting('code')}
                className={`p-2 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('code')
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-xs">&lt;/&gt;</span>
              </button>
            </Tooltip>
            <Tooltip content="Code Block">
              <button
                onClick={() => toggleFormatting('pre')}
                className={`p-2 rounded text-xs touch-manipulation min-w-[50px] min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('pre')
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Code
              </button>
            </Tooltip>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="hidden sm:block text-xs text-gray-500 px-2">
            Press Ctrl+/ for shortcuts
          </div>
        </div>
      )}{/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isSplitView ? (
          <div className="flex h-full">
            {/* Editor Side */}
            <div className="flex-1 border-r border-gray-200 flex flex-col">
              <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
                Editor
              </div>
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleContentChange}
                  onKeyDown={handleKeyDown}
                  onMouseUp={updateActiveFormats}
                  onKeyUp={updateActiveFormats}
                  className="w-full h-full outline-none text-gray-700 leading-relaxed note-content rich-editor text-sm sm:text-base"
                  style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    minHeight: '300px'
                  }}
                  suppressContentEditableWarning={true}
                  data-placeholder="Start writing your note... Use the toolbar above for formatting."
                />
              </div>
            </div>
            
            {/* Preview Side */}
            <div className="flex-1 flex flex-col">
              <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
                Preview
              </div>
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-white">
                <div 
                  className="note-content prose max-w-none text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">Start typing to see preview...</p>' }}
                />
              </div>
            </div>
          </div>
        ) : isPreview ? (
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <div 
              className="note-content prose max-w-none text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        ) : (
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              onMouseUp={updateActiveFormats}
              onKeyUp={updateActiveFormats}
              className="w-full h-full outline-none text-gray-700 leading-relaxed note-content rich-editor text-sm sm:text-base"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                minHeight: '200px'
              }}
              suppressContentEditableWarning={true}
              data-placeholder="Start writing your note... Use the toolbar above for formatting."
            />          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts 
        isVisible={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  )
}
