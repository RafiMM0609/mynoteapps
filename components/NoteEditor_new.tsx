'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
import type { Note } from '../lib/supabase'
import SlashCommandDropdown from './SlashCommandDropdown'

interface NoteEditorProps {
  note: Note
  onSave: (noteId: string, title: string, content: string) => void
  onCancel: () => void
}

export default function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [hasChanges, setHasChanges] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const turndownService = useRef(new TurndownService())

  // Slash command states
  const [showSlashDropdown, setShowSlashDropdown] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [slashStartPos, setSlashStartPos] = useState(0)
  const [activeNode, setActiveNode] = useState<Node | null>(null)

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = renderMarkdown(note.content)
    }
  }, [note.content])

  const handleSave = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      const markdown = turndownService.current.turndown(html)
      onSave(note.id, title, markdown)
    } 
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
      const rawHtml = marked(text, { breaks: true, gfm: true }) as string
      return DOMPurify.sanitize(rawHtml)
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return text
    }
  }

  const handleInput = () => {
    if (!hasChanges) {
      setHasChanges(true)
    }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setShowSlashDropdown(false)
      return
    }

    const range = selection.getRangeAt(0)
    const node = range.startContainer
    const cursorPosition = range.startOffset

    if (node.nodeType !== Node.TEXT_NODE) {
      setShowSlashDropdown(false)
      return
    }

    setActiveNode(node)
    const textContent = node.textContent || ''
    const textBeforeCursor = textContent.substring(0, cursorPosition)
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/')

    if (lastSlashIndex === -1) {
      setShowSlashDropdown(false)
      return
    }

    const query = textBeforeCursor.substring(lastSlashIndex + 1)
    if (query.includes(' ')) {
      setShowSlashDropdown(false)
      return
    }

    setSlashQuery(query)
    setSlashStartPos(lastSlashIndex)

    const rect = range.getBoundingClientRect()
    setSlashPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
    setShowSlashDropdown(true)
  }

  const handleSlashCommandSelect = (command: any) => {
    setShowSlashDropdown(false)

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount || !activeNode || !editorRef.current) {
      return
    }
    
    editorRef.current.focus()

    // First, select the command text (e.g., "/bold") so we can replace it.
    const range = document.createRange()
    range.setStart(activeNode, slashStartPos)
    range.setEnd(activeNode, slashStartPos + slashQuery.length + 1)
    selection.removeAllRanges()
    selection.addRange(range)

    // Now, execute the appropriate formatting command.
    // This will replace the selected command text with the formatted style.
    switch (command.id) {
      case 'heading1':
        document.execCommand('formatBlock', false, '<h1>')
        break
      case 'heading2':
        document.execCommand('formatBlock', false, '<h2>')
        break
      case 'heading3':
        document.execCommand('formatBlock', false, '<h3>')
        break
      case 'bold':
        document.execCommand('bold', false)
        selection.collapseToEnd() // Deselect and place cursor to continue typing
        break
      case 'italic':
        document.execCommand('italic', false)
        selection.collapseToEnd() // Deselect and place cursor
        break
      case 'bulletlist':
        document.execCommand('insertUnorderedList')
        break
      case 'numberlist':
        document.execCommand('insertOrderedList')
        break
      case 'code':
        // For inline code, we wrap the (now empty) selection in <code> tags.
        // This is a common pattern for WYSIWYG editors.
        document.execCommand('insertHTML', false, '<code>&nbsp;</code>')
        break
      case 'codeblock':
        // For a code block, we replace the current paragraph with a <pre> block.
        document.execCommand('insertHTML', false, '<pre><code>&nbsp;</code></pre>')
        break
      default:
        // If the command is not recognized, just delete the trigger text.
        document.execCommand('delete', false)
        break;
    }

    // Clean up state
    setSlashQuery('')
    setActiveNode(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      let container = selection.getRangeAt(0).startContainer;

      // Find if we are inside a list item
      let parentListItem = null;
      let currentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);
      
      while (currentElement && currentElement !== editorRef.current) {
        if (currentElement.nodeName === 'LI') {
          parentListItem = currentElement;
          break;
        }
        currentElement = currentElement.parentElement;
      }

      // If inside a list, let the browser do its default action (create another list item)
      if (parentListItem) {
        return;
      }

      // Otherwise, prevent default to avoid inheriting styles (like bold)
      // and insert a new paragraph for the new line.
      e.preventDefault();
      // Using insertHTML is often more reliable for creating a new, clean block.
      // The browser will typically handle closing the current block and starting a new one.
      document.execCommand('insertHTML', false, '<p><br></p>');
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    if (!hasChanges) {
      setHasChanges(true)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
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
            onChange={handleTitleChange}
            className="w-full text-xl font-semibold text-gray-900 border-none focus:outline-none bg-transparent"
            placeholder="Note title..."
          />
        </div>
        
        <div className="flex items-center space-x-2">
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

      {/* Content Area - WYSIWYG Editor */}
      <div className="flex-1 flex flex-col">
        <div
          ref={editorRef}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          contentEditable={true}
          suppressContentEditableWarning={true}
          className="flex-1 p-6 overflow-auto prose max-w-none focus:outline-none"
        />
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <div>
          {/* Word/char count can be added back here if needed, but might not be in sync during editing */}
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && <span className="text-orange-600">• Unsaved changes</span>}
          <span>Ctrl+S to save</span>
        </div>
      </div>
    </div>
  )
}
