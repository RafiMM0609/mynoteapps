'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Note } from '@/lib/notes'
import { migrateContentToMarkdown, markdownToHtml } from '@/lib/markdown-converter'
import Tooltip from './Tooltip'

interface MarkdownEditorProps {
  note: Note | null
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

export default function MarkdownEditor({ note, onSave, onCancel }: MarkdownEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSplitView, setIsSplitView] = useState(false) // New: split view mode
  const [isLivePreview, setIsLivePreview] = useState(true) // New: live preview mode
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSlashCommand, setShowSlashCommand] = useState(false)
  const [slashCommandPosition, setSlashCommandPosition] = useState({ x: 0, y: 0 })
  const [renderedContent, setRenderedContent] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const slashRangeRef = useRef<{ start: number; end: number } | null>(null)

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
  }, [note])  // Update rendered content when content changes
  useEffect(() => {
    const renderContent = async () => {
      if (content.trim()) {
        try {
          const html = await markdownToHtml(content)
          setRenderedContent(html)
        } catch (error) {
          console.error('Error rendering markdown:', error)
          // Fallback: show content as is if rendering fails
          setRenderedContent(`<pre>${content}</pre>`)
        }
      } else {
        setRenderedContent('<p class="text-gray-400 italic">Start typing your markdown here...</p>')
      }
    }
    
    renderContent()
  }, [content])
  // Handle slash commands
  const handleSlashCommand = useCallback((command: string) => {
    if (!editorRef.current || !slashRangeRef.current) return

    const textarea = editorRef.current
    const { start, end } = slashRangeRef.current
    const beforeSlash = content.substring(0, start)
    const afterSlash = content.substring(end)

    let insertText = ''
    let cursorOffset = 0

    switch (command) {
      case 'heading1':
        insertText = '# '
        cursorOffset = 2
        break
      case 'heading2':
        insertText = '## '
        cursorOffset = 3
        break
      case 'heading3':
        insertText = '### '
        cursorOffset = 4
        break
      case 'bold':
        insertText = '**bold text**'
        cursorOffset = 2
        break
      case 'italic':
        insertText = '*italic text*'
        cursorOffset = 1
        break
      case 'code':
        insertText = '`code`'
        cursorOffset = 1
        break
      case 'codeblock':
        insertText = '```\ncode block\n```'
        cursorOffset = 4
        break
      case 'list':
        insertText = '- '
        cursorOffset = 2
        break
      case 'numberedlist':
        insertText = '1. '
        cursorOffset = 3
        break
      case 'quote':
        insertText = '> '
        cursorOffset = 2
        break
      case 'link':
        insertText = '[link text](url)'
        cursorOffset = 1
        break
      case 'image':
        insertText = '![alt text](image-url)'
        cursorOffset = 2
        break
      case 'table':
        insertText = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |'
        cursorOffset = 2
        break
      case 'divider':
        insertText = '\n---\n'
        cursorOffset = 5
        break
      default:
        insertText = ''
    }

    // Replace the slash with the command content
    const newContent = beforeSlash + insertText + afterSlash
    setContent(newContent)

    // Set cursor position after insertion
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + cursorOffset
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)

    setShowSlashCommand(false)
    slashRangeRef.current = null
  }, [content])  // Handle input changes and slash command detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    
    setContent(value)

    // Check for slash command trigger
    const charBeforeCursor = value[cursorPos - 1]
    const charBeforeSlash = cursorPos >= 2 ? value[cursorPos - 2] : ''
    
    // Show slash command if:
    // 1. Just typed a slash
    // 2. Slash is at beginning of line or after a space
    // 3. Not currently showing slash command
    if (charBeforeCursor === '/' && 
        (cursorPos === 1 || charBeforeSlash === '\n' || charBeforeSlash === ' ') &&
        !showSlashCommand) {
      
      const textarea = e.target
      const rect = textarea.getBoundingClientRect()
      
      // Calculate position more accurately
      const textBeforeCursor = value.substring(0, cursorPos)
      const lines = textBeforeCursor.split('\n')
      const currentLineIndex = lines.length - 1
      const currentLineText = lines[currentLineIndex]
      
      // Approximate character width and line height
      const charWidth = 7
      const lineHeight = 24
      const padding = 16
      
      const x = rect.left + (currentLineText.length * charWidth) + padding
      const y = rect.top + (currentLineIndex * lineHeight) + padding + lineHeight
        // Make sure dropdown is visible on screen
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const dropdownWidth = 250
      const dropdownHeight = 400
      
      const finalX = Math.max(10, Math.min(x, viewportWidth - dropdownWidth - 10))
      let finalY = y
      
      if (y + dropdownHeight > viewportHeight) {
        finalY = Math.max(10, y - dropdownHeight - 30)
      }

      setSlashCommandPosition({ x: finalX, y: finalY })
      slashRangeRef.current = { start: cursorPos - 1, end: cursorPos }
      setShowSlashCommand(true)
    }
    // Hide slash command if we're typing other characters after the slash
    else if (showSlashCommand && slashRangeRef.current) {
      const slashStart = slashRangeRef.current.start
      const currentChar = value[slashStart]
      
      // If the slash character is no longer there, hide the dropdown
      if (currentChar !== '/' || cursorPos < slashStart) {
        setShowSlashCommand(false)
        slashRangeRef.current = null
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
            setIsSplitView(!isSplitView)
          } else {
            setIsPreview(!isPreview)
          }
          break
        case 'l':
          e.preventDefault()
          setIsLivePreview(!isLivePreview)
          break
      }
    }
    
    if (e.key === 'Escape') {
      if (showSlashCommand) {
        setShowSlashCommand(false)
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
    >      {/* Header */}
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
          
          {/* Mode Indicator */}
          <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
            {isPreview && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Preview</span>}
            {isSplitView && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Split</span>}
            {isLivePreview && !isPreview && !isSplitView && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Live</span>}
            {!isPreview && !isSplitView && !isLivePreview && <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Edit</span>}
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-1 sm:space-x-2">        <div className="flex items-center space-x-1">
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

            <Tooltip content="Live Preview (Ctrl+L)">
              <button
                onClick={() => setIsLivePreview(!isLivePreview)}
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm transition-colors touch-manipulation ${
                  isLivePreview 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Live
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
      </div>      {/* Editor/Preview Area */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden">
            <div 
              className="markdown-preview prose prose-gray max-w-none text-sm sm:text-base prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </div>
        ) : isSplitView ? (
          <div className="flex-1 flex">
            {/* Editor Side */}
            <div className="w-1/2 border-r border-gray-200">
              <div className="h-full p-2 sm:p-4">
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Start typing your markdown here... Type / for commands"
                  className="w-full h-full resize-none border-none outline-none font-mono text-sm leading-relaxed"
                  style={{ 
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            </div>
            
            {/* Preview Side */}
            <div className="w-1/2 p-2 sm:p-4 overflow-y-auto overflow-x-hidden bg-gray-50">
              <div 
                className="markdown-preview prose prose-gray max-w-none text-sm sm:text-base prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
            </div>
          </div>        ) : isLivePreview ? (
          <div className="flex-1 relative overflow-hidden bg-white">
            {/* Live Preview Editor Container */}
            <div className="absolute inset-0">
              {/* Rendered markdown overlay */}
              <div 
                className="absolute inset-0 p-4 overflow-y-auto overflow-x-hidden pointer-events-none"
                style={{ 
                  lineHeight: '1.6',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '14px'
                }}
              >
                <div 
                  className="markdown-preview prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              </div>
              
              {/* Transparent textarea for input */}
              <textarea
                ref={editorRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                onScroll={(e) => {
                  // Sync scroll with preview
                  const target = e.target as HTMLTextAreaElement
                  const preview = target.parentElement?.querySelector('.markdown-preview')?.parentElement as HTMLElement
                  if (preview) {
                    preview.scrollTop = target.scrollTop
                  }
                }}
                placeholder={content ? "" : "Start typing your markdown here... Type / for commands"}
                className="absolute inset-0 w-full h-full resize-none border-none outline-none bg-transparent z-20 p-4"
                style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: content ? 'transparent' : '#9CA3AF', // Show placeholder, hide text when typing
                  caretColor: '#1F2937',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 h-full p-2 sm:p-4">
            <textarea
              ref={editorRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Start typing your markdown here... Type / for commands"
              className="w-full h-full resize-none border-none outline-none font-mono text-sm leading-relaxed"
              style={{ 
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                lineHeight: '1.5'
              }}
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
                <span>Split view</span>
                <span className="text-gray-500">Ctrl+Shift+Enter</span>
              </div>
              <div className="flex justify-between">
                <span>Live preview</span>
                <span className="text-gray-500">Ctrl+L</span>
              </div>
              <div className="flex justify-between">
                <span>Fullscreen</span>
                <span className="text-gray-500">F11</span>
              </div>
              <div className="flex justify-between">
                <span>Show shortcuts</span>
                <span className="text-gray-500">Ctrl+/</span>
              </div>
              <div className="flex justify-between">
                <span>Slash commands</span>
                <span className="text-gray-500">/</span>
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
              <hr className="my-2" />
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Slash Commands:</p>
                <p>/h1, /h2, /h3 - Headers</p>
                <p>/bold, /italic - Text formatting</p>
                <p>/code, /codeblock - Code</p>
                <p>/list, /numberedlist - Lists</p>
                <p>/quote - Blockquote</p>
                <p>/link, /image - Links & Images</p>
                <p>/table - Table</p>
                <p>/divider - Horizontal rule</p>
              </div>
            </div>          </div>
        </div>
      )}

      {/* Slash Command Dropdown */}
      {showSlashCommand && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
          style={{
            left: slashCommandPosition.x,
            top: slashCommandPosition.y
          }}
        >
          <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100 mb-2">
            Quick Insert
          </div>
          
          {[
            { id: 'heading1', label: 'Heading 1', desc: '# Large section heading', icon: 'H1' },
            { id: 'heading2', label: 'Heading 2', desc: '## Medium section heading', icon: 'H2' },
            { id: 'heading3', label: 'Heading 3', desc: '### Small section heading', icon: 'H3' },
            { id: 'bold', label: 'Bold', desc: '**Bold text**', icon: 'B' },
            { id: 'italic', label: 'Italic', desc: '*Italic text*', icon: 'I' },
            { id: 'code', label: 'Inline Code', desc: '`code`', icon: '</>' },
            { id: 'codeblock', label: 'Code Block', desc: '```code block```', icon: '{}' },
            { id: 'list', label: 'Bullet List', desc: '- List item', icon: '•' },
            { id: 'numberedlist', label: 'Numbered List', desc: '1. List item', icon: '1.' },
            { id: 'quote', label: 'Quote', desc: '> Blockquote', icon: '"' },
            { id: 'link', label: 'Link', desc: '[text](url)', icon: '🔗' },
            { id: 'image', label: 'Image', desc: '![alt](url)', icon: '🖼️' },
            { id: 'table', label: 'Table', desc: '| Column | Column |', icon: '📊' },
            { id: 'divider', label: 'Divider', desc: '--- horizontal rule', icon: '─' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSlashCommand(item.id)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
            >
              <span className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center font-mono">
                {item.icon}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
