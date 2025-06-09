'use client'

import { useState, useEffect, useRef } from 'react'
import type { Note } from '@/app/page'

interface NoteEditorProps {
  note: Note | null
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

export default function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
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
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          insertFormatting('bold')
          break
        case 'i':
          e.preventDefault()
          insertFormatting('italic')
          break
        case 's':
          e.preventDefault()
          handleSave()
          break
      }
    }
  }
  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title for your note')
      return
    }
    onSave(title, content)
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
        </div>
        
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-2 rounded text-sm transition-colors touch-manipulation ${
              isPreview 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          
          <button
            onClick={onCancel}
            className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors touch-manipulation"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="bg-gray-800 text-white px-3 sm:px-4 py-2 rounded hover:bg-gray-700 transition-colors touch-manipulation"
          >
            Save
          </button>
        </div>
      </div>

      {!isPreview && (
        /* Formatting Toolbar */
        <div className="flex items-center space-x-1 p-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <button
            onClick={() => insertFormatting('bold')}
            className="p-2 sm:p-2 text-gray-600 hover:bg-gray-200 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Bold (Ctrl+B)"
          >
            <strong className="text-sm">B</strong>
          </button>
          <button
            onClick={() => insertFormatting('italic')}
            className="p-2 sm:p-2 text-gray-600 hover:bg-gray-200 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Italic (Ctrl+I)"
          >
            <em className="text-sm">I</em>
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            onClick={() => insertFormatting('h1')}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded text-xs touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => insertFormatting('h2')}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded text-xs touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => insertFormatting('h3')}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded text-xs touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Heading 3"
          >
            H3
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            onClick={() => insertFormatting('ul')}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => insertFormatting('ol')}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded text-xs touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Numbered List"
          >
            1.
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            onClick={() => insertFormatting('code')}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Inline Code"
          >
            <span className="text-xs">&lt;/&gt;</span>
          </button>
          <button
            onClick={() => insertFormatting('pre')}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded text-xs touch-manipulation min-w-[50px] min-h-[36px] flex items-center justify-center"
            title="Code Block"
          >
            Code
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        {isPreview ? (
          <div 
            className="note-content prose max-w-none text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full outline-none text-gray-700 leading-relaxed note-content rich-editor text-sm sm:text-base"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              minHeight: '200px'
            }}
            suppressContentEditableWarning={true}
            data-placeholder="Start writing your note... Use the toolbar above for formatting."
          />
        )}
      </div>
    </div>
  )
}
