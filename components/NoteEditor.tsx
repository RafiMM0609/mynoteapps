'use client'

import { useState, useEffect, useRef } from 'react'
import type { Note } from '@/app/page'
import Tooltip from './Tooltip'
import KeyboardShortcuts from './KeyboardShortcuts'
import SlashCommandDropdown from './SlashCommandDropdown'

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
  // const [showCleanPasteToast, setShowCleanPasteToast] = useState(false) // Unused for now
  const [showSlashCommand, setShowSlashCommand] = useState(false)
  const [slashCommandPosition, setSlashCommandPosition] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const slashRangeRef = useRef<Range | null>(null)
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
    // Handle slash command when not holding Ctrl/Cmd
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !showSlashCommand) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0)
        
        e.preventDefault()
        
        // Insert the slash character
        const textNode = document.createTextNode('/')
        range.insertNode(textNode)
        
        // Position cursor after the slash
        range.setStartAfter(textNode)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
          // Store the range for later deletion
        slashRangeRef.current = range.cloneRange()
        slashRangeRef.current.setStartBefore(textNode)
        
        // Get cursor position for dropdown with better positioning
        const rect = range.getBoundingClientRect()
        
        // Ensure we have valid coordinates
        if (rect.left >= 0 && rect.top >= 0) {
          setSlashCommandPosition({
            x: rect.left,
            y: rect.top // Use rect.top directly for fixed positioning
          })
          setShowSlashCommand(true)
        } else {
          // Fallback positioning if getBoundingClientRect fails
          setSlashCommandPosition({
            x: 100,
            y: 100
          })
          setShowSlashCommand(true)
        }
        
        return
      }
    }

    // Handle existing keyboard shortcuts
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
        case 'v':
          if (e.shiftKey) {
            e.preventDefault()
            pasteAsPlainText()
          }
          break
      }
    }    // Close slash command on Escape
    if (e.key === 'Escape') {
      if (showSlashCommand) {
        setShowSlashCommand(false)
        slashRangeRef.current = null
      } else if (isFullscreen) {
        setIsFullscreen(false)
      }
    }
    
    // Toggle fullscreen on F11
    if (e.key === 'F11') {
      e.preventDefault()
      setIsFullscreen(!isFullscreen)
    }
  }
  // Handle paste events to clean external formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    
    const clipboardData = e.clipboardData
    if (!clipboardData) return

    // Get plain text from clipboard
    let pastedText = clipboardData.getData('text/plain')
    
    // If no plain text, try to get HTML and strip tags
    if (!pastedText) {
      const htmlText = clipboardData.getData('text/html')
      if (htmlText) {
        // Create a temporary div to strip HTML tags
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = htmlText
        pastedText = tempDiv.textContent || tempDiv.innerText || ''
      }
    }

    // Clean the text further (remove extra whitespace, normalize line breaks)
    pastedText = pastedText
      .replace(/\r\n/g, '\n')  // Normalize Windows line endings
      .replace(/\r/g, '\n')    // Normalize Mac line endings
      .replace(/\t/g, ' ')     // Convert tabs to single space
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks to maximum 2
      .trim()

    if (!pastedText) return

    // Insert the cleaned text
    const selection = window.getSelection()
    if (!selection || !editorRef.current) return

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      
      // Split text by line breaks but be more conservative with paragraph creation
      const lines = pastedText.split('\n')
      
      if (lines.length === 1) {
        // Single line - insert as text node
        const textNode = document.createTextNode(pastedText)
        range.insertNode(textNode)
        
        // Position cursor after inserted text
        range.setStartAfter(textNode)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // Multiple lines - insert with minimal formatting
        const fragment = document.createDocumentFragment()
        
        lines.forEach((line, index) => {
          if (line.trim()) {
            const textNode = document.createTextNode(line.trim())
            fragment.appendChild(textNode)
            
            // Add line break only if not the last line
            if (index < lines.length - 1) {
              const br = document.createElement('br')
              fragment.appendChild(br)
            }
          } else if (index < lines.length - 1 && lines[index + 1]?.trim()) {
            // Only add break for empty lines if there's content after
            const br = document.createElement('br')
            fragment.appendChild(br)
          }
        })
        
        range.insertNode(fragment)
        
        // Position cursor at the end
        range.setStartAfter(fragment.lastChild || fragment)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      // Update content state
      handleContentChange()
    }
  }

  // Manual paste as plain text function
  const pasteAsPlainText = async () => {
    if (!editorRef.current) return

    try {
      // Read from clipboard
      const clipboardText = await navigator.clipboard.readText()
      
      if (!clipboardText) return      // Clean the text
      const cleanText = clipboardText
        .replace(/\r\n/g, '\n')  // Normalize Windows line endings
        .replace(/\r/g, '\n')    // Normalize Mac line endings
        .replace(/\t/g, ' ')     // Convert tabs to single space
        .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks to maximum 2
        .trim()

      // Insert the cleaned text
      const selection = window.getSelection()
      if (!selection) return

      editorRef.current.focus()

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        // Split text by line breaks but be more conservative with formatting
        const lines = cleanText.split('\n')
        
        if (lines.length === 1) {
          // Single line - insert as text node
          const textNode = document.createTextNode(cleanText)
          range.insertNode(textNode)
          
          // Position cursor after inserted text
          range.setStartAfter(textNode)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          // Multiple lines - insert with minimal formatting
          const fragment = document.createDocumentFragment()
          
          lines.forEach((line, index) => {
            if (line.trim()) {
              const textNode = document.createTextNode(line.trim())
              fragment.appendChild(textNode)
              
              // Add line break only if not the last line
              if (index < lines.length - 1) {
                const br = document.createElement('br')
                fragment.appendChild(br)
              }
            } else if (index < lines.length - 1 && lines[index + 1]?.trim()) {
              // Only add break for empty lines if there's content after
              const br = document.createElement('br')
              fragment.appendChild(br)
            }
          })
          
          range.insertNode(fragment)
          
          // Position cursor at the end
          range.setStartAfter(fragment.lastChild || fragment)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        // Update content state
        handleContentChange()
      }
    } catch (error) {
      console.error('Failed to read from clipboard:', error)
      // Fallback: show instruction to user
      alert('Unable to access clipboard. Please use Ctrl+V to paste, the text will be automatically cleaned.')    }
  }

  // Handle slash command selection
  const handleSlashCommand = (commandType: string) => {
    if (!editorRef.current) return

    // Remove the slash character using the stored range
    if (slashRangeRef.current) {
      slashRangeRef.current.deleteContents()
      
      // Position cursor where the slash was
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(slashRangeRef.current)
      }
    }

    // Close the dropdown
    setShowSlashCommand(false)
    slashRangeRef.current = null

    // Apply the formatting
    toggleFormatting(commandType)
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

    // Store current selection before focusing
    const selection = window.getSelection()
    let range: Range | null = null
    let hasSelection = false
    
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0).cloneRange()
      hasSelection = !range.collapsed
    }

    editorRef.current.focus()
    
    // Restore selection if we had one
    if (range && selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    // Check if format is currently active
    const isActive = activeFormats.has(format)
    
    if (format === 'bold' || format === 'italic') {
      // Use execCommand for better support with toggle
      if (format === 'bold') {
        document.execCommand('bold', false, '')
      } else {
        document.execCommand('italic', false, '')
      }
      
      // Maintain cursor position after formatting
      if (!hasSelection) {
        // If no text was selected, position cursor correctly
        const newSelection = window.getSelection()
        if (newSelection && newSelection.rangeCount > 0) {
          const newRange = newSelection.getRangeAt(0)
          newRange.collapse(true)
          newSelection.removeAllRanges()
          newSelection.addRange(newRange)
        }
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
        
        // Position cursor inside the element for headings, after for others
        const newRange = document.createRange()
        if (['h1', 'h2', 'h3'].includes(tag)) {
          // For headings, position cursor at the end of the text content
          newRange.selectNodeContents(element)
          newRange.collapse(false)
        } else {
          // For other elements, position after the break
          newRange.setStartAfter(br)
          newRange.collapse(true)
        }
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // For inline elements, position cursor after the element
        const newRange = document.createRange()
        if (tag === 'code') {
          // For inline code, position cursor at the end of the text content
          newRange.selectNodeContents(element)
          newRange.collapse(false)
        } else {
          newRange.setStartAfter(element)
          newRange.collapse(true)
        }
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    } catch (error) {
      console.error('Error inserting element:', error)    }
    
    // Update content state
    handleContentChange()
  }

  return (
    <div className={`flex-1 flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
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
              <Tooltip content="Split View (Ctrl+Shift+Enter)">
              <button
                onClick={() => setIsSplitView(!isSplitView)}
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm transition-colors touch-manipulation ${
                  isSplitView 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Split
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
      </div>      {(!isPreview || isSplitView) && (
        /* Formatting Toolbar */
        <div className="flex items-center space-x-1 p-1 sm:p-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
          <div className="flex items-center space-x-1">
            <Tooltip content="Bold (Ctrl+B)">
              <button
                onClick={() => toggleFormatting('bold')}
                className={`p-1 sm:p-2 rounded touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('bold')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <strong className="text-xs sm:text-sm">B</strong>
              </button>
            </Tooltip>
            <Tooltip content="Italic (Ctrl+I)">
              <button
                onClick={() => toggleFormatting('italic')}
                className={`p-1 sm:p-2 rounded touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('italic')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <em className="text-xs sm:text-sm">I</em>
              </button>
            </Tooltip>
          </div>
          
          <div className="w-px h-4 sm:h-6 bg-gray-300 mx-1"></div>
          
          <div className="flex items-center space-x-1">
            <Tooltip content="Heading 1">
              <button
                onClick={() => toggleFormatting('h1')}
                className={`p-1 sm:p-2 rounded text-xs touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
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
                className={`p-1 sm:p-2 rounded text-xs touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
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
                className={`p-1 sm:p-2 rounded text-xs touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('h3')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                H3
              </button>
            </Tooltip>
          </div>
          
          <div className="w-px h-4 sm:h-6 bg-gray-300 mx-1"></div>
          
          <div className="flex items-center space-x-1">
            <Tooltip content="Bullet List">
              <button
                onClick={() => toggleFormatting('ul')}
                className={`p-1 sm:p-2 rounded touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('ul')
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </Tooltip>
            <Tooltip content="Numbered List">
              <button
                onClick={() => toggleFormatting('ol')}
                className={`p-1 sm:p-2 rounded text-xs touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('ol')
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                1.
              </button>
            </Tooltip>
          </div>
          
          <div className="w-px h-4 sm:h-6 bg-gray-300 mx-1"></div>
          
          <div className="flex items-center space-x-1">
            <Tooltip content="Inline Code">
              <button
                onClick={() => toggleFormatting('code')}
                className={`p-1 sm:p-2 rounded touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
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
                className={`p-1 sm:p-2 rounded text-xs touch-manipulation min-w-[35px] min-h-[28px] sm:min-w-[50px] sm:min-h-[36px] flex items-center justify-center transition-colors ${
                  activeFormats.has('pre')
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Code
              </button>
            </Tooltip>
          </div>
          
          <div className="w-px h-4 sm:h-6 bg-gray-300 mx-1"></div>
          
          <div className="flex items-center space-x-1">
            <Tooltip content="Paste as Plain Text (Ctrl+Shift+V)">
              <button
                onClick={pasteAsPlainText}
                className="p-1 sm:p-2 rounded touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors text-gray-600 hover:bg-gray-200"
                title="Clean paste without formatting"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </Tooltip>
            
            {/* Mobile Copy/Select All Helper */}
            <Tooltip content="Select All Text">
              <button
                onClick={() => {
                  if (editorRef.current) {
                    const range = document.createRange()
                    range.selectNodeContents(editorRef.current)
                    const selection = window.getSelection()
                    if (selection) {
                      selection.removeAllRanges()
                      selection.addRange(range)
                    }
                  }
                }}
                className="p-1 sm:p-2 rounded touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center transition-colors text-gray-600 hover:bg-gray-200 sm:hidden"
                title="Select all text for easy copying"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            </Tooltip>
          </div>
            <div className="flex-1"></div>
          
          {/* Mobile copy/paste hint */}
          <div className="sm:hidden text-xs text-gray-400 px-1 whitespace-nowrap">
            Long press to copy
          </div>
          
          <div className="hidden sm:block text-xs text-gray-500 px-2">
            Press Ctrl+/ for shortcuts
          </div>
        </div>
      )}{/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isSplitView ? (
          <div className="flex h-full">            {/* Editor Side */}
            <div className="flex-1 border-r border-gray-200 flex flex-col">
              <div className="bg-gray-100 px-2 py-1 sm:px-3 sm:py-2 text-xs font-medium text-gray-600">
                Editor
              </div>
              <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleContentChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  onMouseUp={updateActiveFormats}
                  onKeyUp={updateActiveFormats}
                  className="w-full h-full outline-none text-gray-700 leading-relaxed note-content rich-editor text-sm sm:text-base"
                  style={{ 
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    minHeight: '200px'
                  }}
                  suppressContentEditableWarning={true}
                  data-placeholder="Start writing your note... Use the toolbar above for formatting."
                />
              </div>
            </div>
            
            {/* Preview Side */}
            <div className="flex-1 flex flex-col">
              <div className="bg-gray-100 px-2 py-1 sm:px-3 sm:py-2 text-xs font-medium text-gray-600">
                Preview
              </div>
              <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden bg-white">
                <div 
                  className="note-content prose max-w-none text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">Start typing to see preview...</p>' }}
                />
              </div>
            </div>
          </div>        ) : isPreview ? (
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
            <div 
              className="note-content prose max-w-none text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        ) : (
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleContentChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onMouseUp={updateActiveFormats}
              onKeyUp={updateActiveFormats}
              className="w-full h-full outline-none text-gray-700 leading-relaxed note-content rich-editor text-sm sm:text-base"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                minHeight: '150px'
              }}
              suppressContentEditableWarning={true}
              data-placeholder="Start writing your note... Use the toolbar above for formatting."
            />
          </div>
        )}</div>

      {/* Slash Command Dropdown */}
      <SlashCommandDropdown
        isVisible={showSlashCommand}
        position={slashCommandPosition}
        onClose={() => {
          setShowSlashCommand(false)
          slashRangeRef.current = null
        }}
        onSelectCommand={handleSlashCommand}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts 
        isVisible={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  )
}
