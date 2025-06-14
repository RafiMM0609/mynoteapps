'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Note } from '@/lib/notes'
import { migrateContentToMarkdown, markdownToHtml, htmlToMarkdown } from '@/lib/markdown-converter'
import Tooltip from './Tooltip'

interface RichTextEditorProps {
  note: Note | null
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

export default function RichTextEditor({ note, onSave, onCancel }: RichTextEditorProps) {  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSlashCommand, setShowSlashCommand] = useState(false)
  const [slashCommandPosition, setSlashCommandPosition] = useState({ x: 0, y: 0 })
  const [slashSearchQuery, setSlashSearchQuery] = useState('') // New: search query
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0) // New: keyboard navigation
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
    const titleInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const slashRangeRef = useRef<Range | null>(null)

  // Slash command options
  const slashCommands = [
    { id: 'heading1', label: 'Heading 1', desc: 'Large section heading', icon: 'H1', keywords: ['h1', 'heading', 'title', 'large'] },
    { id: 'heading2', label: 'Heading 2', desc: 'Medium section heading', icon: 'H2', keywords: ['h2', 'heading', 'subtitle', 'medium'] },
    { id: 'heading3', label: 'Heading 3', desc: 'Small section heading', icon: 'H3', keywords: ['h3', 'heading', 'small'] },
    { id: 'bold', label: 'Bold', desc: 'Bold text', icon: 'B', keywords: ['bold', 'strong', 'thick'] },
    { id: 'italic', label: 'Italic', desc: 'Italic text', icon: 'I', keywords: ['italic', 'em', 'emphasis', 'slant'] },
    { id: 'code', label: 'Inline Code', desc: 'Code text', icon: '</>', keywords: ['code', 'inline', 'monospace'] },
    { id: 'codeblock', label: 'Code Block', desc: 'Code block', icon: '{}', keywords: ['codeblock', 'code', 'block', 'pre'] },
    { id: 'list', label: 'Bullet List', desc: 'Bullet list', icon: '•', keywords: ['list', 'bullet', 'ul', 'unordered'] },
    { id: 'numberedlist', label: 'Numbered List', desc: 'Numbered list', icon: '1.', keywords: ['numbered', 'list', 'ol', 'ordered'] },
    { id: 'quote', label: 'Quote', desc: 'Blockquote', icon: '"', keywords: ['quote', 'blockquote', 'citation'] },
    { id: 'link', label: 'Link', desc: 'Insert link', icon: '🔗', keywords: ['link', 'url', 'href', 'anchor'] },
    { id: 'divider', label: 'Divider', desc: 'Horizontal rule', icon: '─', keywords: ['divider', 'hr', 'separator', 'line'] },
  ]
  // Filter slash commands based on search query
  const filteredSlashCommands = slashCommands.filter(command => {
    if (!slashSearchQuery) return true
    const query = slashSearchQuery.toLowerCase()
    return (
      command.label.toLowerCase().includes(query) ||
      command.desc.toLowerCase().includes(query) ||
      command.keywords.some(keyword => keyword.includes(query))
    )
  })

  // Reset selected index when filtered commands change
  useEffect(() => {
    if (selectedSlashIndex >= filteredSlashCommands.length) {
      setSelectedSlashIndex(0)
    }
  }, [filteredSlashCommands.length, selectedSlashIndex])

  useEffect(() => {
    if (note) {      setTitle(note.title)
      const markdownContent = migrateContentToMarkdown(note.content)
      setContent(markdownContent)
      
      // Convert markdown to HTML for rich editing
      const convertToHtml = async () => {
        try {
          const html = await markdownToHtml(markdownContent)
          if (editorRef.current) {
            editorRef.current.innerHTML = html
          }
        } catch (error) {
          console.error('Error converting markdown to HTML:', error)
          if (editorRef.current) {
            editorRef.current.innerHTML = markdownContent
          }
        }
      }
      
      convertToHtml()
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
  // Convert HTML back to markdown when content changes
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      
      // Convert HTML to markdown in background
      try {
        const markdown = htmlToMarkdown(html)
        setContent(markdown)
      } catch (error) {
        console.error('Error converting HTML to markdown:', error)
        setContent(html)
      }
      
      updateActiveFormats()
    }
  }, [])

  // Update active format buttons based on cursor position
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
          const computedStyle = window.getComputedStyle(element as Element)
          
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
            case 'ul':
              formats.add('ul')
              break
            case 'ol':
              formats.add('ol')
              break
          }
          
          // Check for inline styles
          if (computedStyle.fontWeight === 'bold' || computedStyle.fontWeight === '700') {
            formats.add('bold')
          }
          if (computedStyle.fontStyle === 'italic') {
            formats.add('italic')
          }
        }
        element = element.parentNode!
      }
    }
    
    setActiveFormats(formats)
  }
  // Apply formatting using execCommand with toggle functionality
  const applyFormat = (command: string, value?: string) => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    
    try {
      // Check if format is already active for toggle functionality
      const isActive = activeFormats.has(command.toLowerCase())
      
      switch (command.toLowerCase()) {
        case 'bold':
          document.execCommand('bold', false)
          break
        case 'italic':
          document.execCommand('italic', false)
          break
        case 'code':
          // Toggle inline code
          if (isActive) {
            // Remove code formatting
            document.execCommand('removeFormat', false)
          } else {
            // Apply code formatting
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              const selectedText = range.toString()
              
              if (selectedText) {
                const codeElement = document.createElement('code')
                codeElement.textContent = selectedText
                range.deleteContents()
                range.insertNode(codeElement)
                
                // Clear selection
                selection.removeAllRanges()
                range.setStartAfter(codeElement)
                range.collapse(true)
                selection.addRange(range)
              }
            }
          }
          break
        default:
          document.execCommand(command, false, value)
      }
      
      handleContentChange()
    } catch (error) {
      console.error('Error applying format:', error)
    }
  }

  // Toggle format - if already active, remove it; if not, apply it
  const toggleFormat = (formatType: string) => {
    const isActive = activeFormats.has(formatType)
    
    if (isActive) {
      // Remove format
      switch (formatType) {
        case 'bold':
          document.execCommand('bold', false)
          break
        case 'italic':
          document.execCommand('italic', false)
          break
        case 'code':
          document.execCommand('removeFormat', false)
          break
      }
    } else {
      // Apply format
      applyFormat(formatType)
    }
  }
  // Handle slash commands for quick formatting
  const handleSlashCommand = useCallback((command: string) => {
    if (!editorRef.current || !slashRangeRef.current) return

    const range = slashRangeRef.current
    
    // Remove the slash character and search query
    range.deleteContents()
    
    // Check if format is already active for toggle functionality
    const isFormatActive = (formatType: string) => {
      return activeFormats.has(formatType)
    }

    let element: HTMLElement | null = null
    let shouldToggle = false
    
    switch (command) {
      case 'heading1':
        if (isFormatActive('h1')) {
          // Convert back to paragraph
          document.execCommand('formatBlock', false, 'p')
          shouldToggle = true
        } else {
          document.execCommand('formatBlock', false, 'h1')
        }
        break
      case 'heading2':
        if (isFormatActive('h2')) {
          document.execCommand('formatBlock', false, 'p')
          shouldToggle = true
        } else {
          document.execCommand('formatBlock', false, 'h2')
        }
        break
      case 'heading3':
        if (isFormatActive('h3')) {
          document.execCommand('formatBlock', false, 'p')
          shouldToggle = true
        } else {
          document.execCommand('formatBlock', false, 'h3')
        }
        break
      case 'bold':
        if (isFormatActive('bold')) {
          document.execCommand('bold', false)
          shouldToggle = true
        } else {
          element = document.createElement('strong')
          element.textContent = 'Bold text'
        }
        break
      case 'italic':
        if (isFormatActive('italic')) {
          document.execCommand('italic', false)
          shouldToggle = true
        } else {
          element = document.createElement('em')
          element.textContent = 'Italic text'
        }
        break
      case 'code':
        if (isFormatActive('code')) {
          document.execCommand('removeFormat', false)
          shouldToggle = true
        } else {
          element = document.createElement('code')
          element.textContent = 'code'
        }
        break
      case 'codeblock':
        element = document.createElement('pre')
        const codeEl = document.createElement('code')
        codeEl.textContent = 'code block'
        element.appendChild(codeEl)
        break
      case 'list':
        if (isFormatActive('ul')) {
          document.execCommand('insertUnorderedList', false)
          shouldToggle = true
        } else {
          document.execCommand('insertUnorderedList', false)
        }
        break
      case 'numberedlist':
        if (isFormatActive('ol')) {
          document.execCommand('insertOrderedList', false)
          shouldToggle = true
        } else {
          document.execCommand('insertOrderedList', false)
        }
        break
      case 'quote':
        element = document.createElement('blockquote')
        element.textContent = 'Quote text'
        break
      case 'link':
        const url = prompt('Enter URL:')
        if (url) {
          element = document.createElement('a')
          element.setAttribute('href', url)
          element.textContent = 'Link text'
        }
        break
      case 'divider':
        element = document.createElement('hr')
        break
      default:
        return
    }

    // Insert element if created
    if (element && !shouldToggle) {
      range.insertNode(element)
      
      // Position cursor appropriately
      const newRange = document.createRange()
      if (element.tagName === 'HR') {
        newRange.setStartAfter(element)
      } else {
        newRange.selectNodeContents(element)
        newRange.collapse(false)
      }
      
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }

    handleContentChange()
    setShowSlashCommand(false)
    setSlashSearchQuery('')
    setSelectedSlashIndex(0)
    slashRangeRef.current = null  }, [activeFormats, handleContentChange])
  // Handle input events
  const handleInput = () => {
    handleContentChange()
    
    // Check for slash command
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const textNode = range.startContainer
      
      if (textNode.nodeType === Node.TEXT_NODE) {
        const text = textNode.textContent || ''
        const cursorPos = range.startOffset
        
        // Find the last slash before cursor
        let slashPos = -1
        for (let i = cursorPos - 1; i >= 0; i--) {
          if (text[i] === '/') {
            // Check if slash is at beginning of line or after space
            if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '\n') {
              slashPos = i
              break
            }
          } else if (text[i] === ' ' || text[i] === '\n') {
            // Stop searching if we hit a space or newline before finding slash
            break
          }
        }
        
        if (slashPos !== -1) {
          // Extract search query after slash
          const searchQuery = text.substring(slashPos + 1, cursorPos)
          
          // Check if search query contains space - if so, close dropdown
          if (searchQuery.includes(' ')) {
            setShowSlashCommand(false)
            setSlashSearchQuery('')
            slashRangeRef.current = null
            return
          }
          
          // Update search query
          setSlashSearchQuery(searchQuery)
          setSelectedSlashIndex(0) // Reset selection
          
          if (!showSlashCommand) {            // Show dropdown if not already showing
            const rect = range.getBoundingClientRect()
            
            const x = rect.left
            const y = rect.bottom + 5
            
            // Make sure dropdown is visible
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            const dropdownWidth = 300
            const dropdownHeight = 400
            
            const finalX = Math.max(10, Math.min(x, viewportWidth - dropdownWidth - 10))
            let finalY = y
            
            if (y + dropdownHeight > viewportHeight) {
              finalY = Math.max(10, rect.top - dropdownHeight - 5)
            }

            setSlashCommandPosition({ x: finalX, y: finalY })
            
            // Store range for deletion (include the slash and search query)
            const newRange = range.cloneRange()
            newRange.setStart(textNode, slashPos)
            newRange.setEnd(textNode, cursorPos)
            slashRangeRef.current = newRange
            
            setShowSlashCommand(true)
          } else {
            // Update range to include current search query
            const newRange = range.cloneRange()
            newRange.setStart(textNode, slashPos)
            newRange.setEnd(textNode, cursorPos)
            slashRangeRef.current = newRange
          }
        } else if (showSlashCommand) {
          // Hide slash command if no slash found
          setShowSlashCommand(false)
          setSlashSearchQuery('')
          slashRangeRef.current = null
        }
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle slash command navigation
    if (showSlashCommand) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedSlashIndex(prev => 
            prev < filteredSlashCommands.length - 1 ? prev + 1 : 0
          )
          return
        case 'ArrowUp':
          e.preventDefault()
          setSelectedSlashIndex(prev => 
            prev > 0 ? prev - 1 : filteredSlashCommands.length - 1
          )
          return
        case 'Enter':
          e.preventDefault()
          if (filteredSlashCommands[selectedSlashIndex]) {
            handleSlashCommand(filteredSlashCommands[selectedSlashIndex].id)
          }
          return
        case 'Escape':
          e.preventDefault()
          setShowSlashCommand(false)
          setSlashSearchQuery('')
          setSelectedSlashIndex(0)
          slashRangeRef.current = null
          return
      }
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault()
          handleSave()
          break
        case 'b':
          e.preventDefault()
          toggleFormat('bold')
          break
        case 'i':
          e.preventDefault()
          toggleFormat('italic')
          break
        case '/':
          e.preventDefault()
          setShowShortcuts(true)
          break
        case '1':
          e.preventDefault()
          applyFormat('formatBlock', 'h1')
          break
        case '2':
          e.preventDefault()
          applyFormat('formatBlock', 'h2')
          break
        case '3':
          e.preventDefault()
          applyFormat('formatBlock', 'h3')
          break
      }
    }
    
    if (e.key === 'Escape') {
      if (showSlashCommand) {
        setShowSlashCommand(false)
        setSlashSearchQuery('')
        setSelectedSlashIndex(0)
        slashRangeRef.current = null
      } else if (isFullscreen) {
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
          
          <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Rich Text</span>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
          {/* Formatting Toolbar */}
          <div className="flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2">            <Tooltip content="Bold (Ctrl+B)">
              <button
                onClick={() => toggleFormat('bold')}
                className={`p-1 sm:p-2 rounded transition-colors ${
                  activeFormats.has('bold') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                </svg>
              </button>
            </Tooltip>
            
            <Tooltip content="Italic (Ctrl+I)">
              <button
                onClick={() => toggleFormat('italic')}
                className={`p-1 sm:p-2 rounded transition-colors ${
                  activeFormats.has('italic') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
                </svg>
              </button>
            </Tooltip>
            
            <Tooltip content="Heading 1 (Ctrl+1)">
              <button
                onClick={() => applyFormat('formatBlock', 'h1')}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  activeFormats.has('h1') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                H1
              </button>
            </Tooltip>
            
            <Tooltip content="Heading 2 (Ctrl+2)">
              <button
                onClick={() => applyFormat('formatBlock', 'h2')}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  activeFormats.has('h2') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                H2
              </button>
            </Tooltip>
            
            <Tooltip content="Bullet List">
              <button
                onClick={() => applyFormat('insertUnorderedList')}
                className={`p-1 sm:p-2 rounded transition-colors ${
                  activeFormats.has('ul') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                </svg>
              </button>
            </Tooltip>
            
            <Tooltip content="Numbered List">
              <button
                onClick={() => applyFormat('insertOrderedList')}
                className={`p-1 sm:p-2 rounded transition-colors ${
                  activeFormats.has('ol') 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
                </svg>
              </button>
            </Tooltip>
          </div>
          
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

      {/* Rich Text Editor */}
      <div className="flex-1 overflow-hidden">        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          className="flex-1 p-4 h-full overflow-y-auto focus:outline-none rich-text-editor"
          style={{
            minHeight: '400px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
          suppressContentEditableWarning={true}
        />
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
                <span>Bold</span>
                <span className="text-gray-500">Ctrl+B</span>
              </div>
              <div className="flex justify-between">
                <span>Italic</span>
                <span className="text-gray-500">Ctrl+I</span>
              </div>
              <div className="flex justify-between">
                <span>Heading 1</span>
                <span className="text-gray-500">Ctrl+1</span>
              </div>
              <div className="flex justify-between">
                <span>Heading 2</span>
                <span className="text-gray-500">Ctrl+2</span>
              </div>
              <div className="flex justify-between">
                <span>Heading 3</span>
                <span className="text-gray-500">Ctrl+3</span>
              </div>
              <div className="flex justify-between">
                <span>Slash commands</span>
                <span className="text-gray-500">/</span>
              </div>
              <div className="flex justify-between">
                <span>Fullscreen</span>
                <span className="text-gray-500">F11</span>
              </div>
              <div className="flex justify-between">
                <span>Show shortcuts</span>
                <span className="text-gray-500">Ctrl+/</span>
              </div>
              <hr className="my-2" />
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Rich Text Features:</p>
                <p>• Type normally - no markdown syntax needed</p>
                <p>• Use toolbar buttons for formatting</p>
                <p>• Slash commands for quick insertion</p>
                <p>• Content automatically saved as markdown</p>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Slash Command Dropdown */}
      {showSlashCommand && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-72"
          style={{
            left: slashCommandPosition.x,
            top: slashCommandPosition.y
          }}
        >          <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100 mb-2">
            {slashSearchQuery ? (
              <>Searching for &ldquo;<span className="font-mono">{slashSearchQuery}</span>&rdquo; • {filteredSlashCommands.length} results</>
            ) : (
              <>Quick Insert • Use ↑↓ to navigate, Enter to select</>
            )}
          </div>
          
          {filteredSlashCommands.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              No commands found for &ldquo;<span className="font-mono">{slashSearchQuery}</span>&rdquo;
            </div>
          ) : (
            filteredSlashCommands.map((item, index) => {
              const isActive = activeFormats.has(item.id) || 
                              (item.id === 'bold' && activeFormats.has('bold')) ||
                              (item.id === 'italic' && activeFormats.has('italic')) ||
                              (item.id === 'code' && activeFormats.has('code')) ||
                              (item.id.includes('heading') && activeFormats.has(item.id.replace('heading', 'h')))
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSlashCommand(item.id)}
                  className={`w-full px-3 py-2 text-left flex items-center space-x-3 transition-colors ${
                    index === selectedSlashIndex 
                      ? 'bg-blue-50 border-l-2 border-blue-500' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className={`w-6 h-6 rounded text-xs flex items-center justify-center font-mono ${
                    isActive 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium flex items-center gap-2 ${
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {item.label}
                      {isActive && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                          Active - Click to remove
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  {index === selectedSlashIndex && (
                    <div className="text-xs text-blue-600">
                      ⏎
                    </div>
                  )}
                </button>
              )
            })
          )}
          
          {filteredSlashCommands.length > 0 && (
            <div className="px-3 py-1 text-xs text-gray-400 border-t border-gray-100 mt-2">
              Type to filter • ↑↓ Navigate • Enter Select • Esc Cancel
            </div>
          )}
        </div>
      )}
    </div>
  )
}
