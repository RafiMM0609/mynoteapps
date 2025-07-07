'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckIcon, XMarkIcon, EyeIcon, CodeBracketIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
import type { Note } from '../lib/supabase'
import MarkdownPreview from './MarkdownPreview'
import SlashCommandDropdown from './SlashCommandDropdown'
import FloatingActionButtons from './FloatingActionButtons'

// Import SlashCommand interface
interface SlashCommand {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => { before: string; after: string }
}

interface NoteEditorWithMarkdownPreviewProps {
  note: Note
  onSave: (noteId: string, title: string, content: string) => void
  onCancel: () => void
  availableNotes?: Note[]
  onNoteClick?: (note: Note) => void
  onCreateNewNote?: (title: string) => void
}

type EditorMode = 'edit' | 'preview' | 'split'

export default function NoteEditorWithMarkdownPreview({ 
  note, 
  onSave, 
  onCancel, 
  availableNotes = [], 
  onNoteClick, 
  onCreateNewNote 
}: NoteEditorWithMarkdownPreviewProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [wysiwygContent, setWysiwygContent] = useState('') // Separate state for WYSIWYG content
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('edit')
  const [syncScroll, setSyncScroll] = useState(true)
  const [isTyping, setIsTyping] = useState(false) // Track typing state
  
  // State for slash commands
  const [showSlashDropdown, setShowSlashDropdown] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  
  const wysiwygEditorRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const turndownService = useRef<TurndownService | null>(null)

  // Detect mobile device
  const isMobileDevice = () => typeof window !== 'undefined' && window.innerWidth <= 768

  // Setup Turndown service for converting HTML back to markdown
  useEffect(() => {
    if (!turndownService.current && typeof window !== 'undefined') {
      turndownService.current = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      })
      
      // Custom rules for better markdown conversion
      turndownService.current.addRule('strikethrough', {
        filter: ['del', 's'],
        replacement: (content) => `~~${content}~~`
      })
    }
  }, [])

  // Convert markdown to HTML for WYSIWYG editor
  const markdownToHtml = (markdown: string): string => {
    if (!markdown.trim()) return ''
    
    try {
      const html = marked.parse(markdown, {
        breaks: true,
        gfm: true
      }) as string
      return DOMPurify.sanitize(html)
    } catch (error) {
      console.error('Error converting markdown to HTML:', error)
      return markdown
    }
  }

  // Convert HTML back to markdown
  const htmlToMarkdown = (html: string): string => {
    if (!turndownService.current || !html.trim()) return ''
    
    try {
      return turndownService.current.turndown(html)
    } catch (error) {
      console.error('Error converting HTML to markdown:', error)
      return html
    }
  }

  useEffect(() => {
    const hasContentChanges = content !== (note.content || '')
    const hasTitleChanges = title !== note.title
    setHasChanges(hasContentChanges || hasTitleChanges)
  }, [content, title, note.content, note.title])

  // // Auto-save effect
  // useEffect(() => {
  //   if (hasChanges) {
  //     const timer = setTimeout(() => {
  //       handleSave()
  //     }, 3000) // Auto-save after 3 seconds of inactivity
      
  //     return () => clearTimeout(timer)
  //   }
  // }, [hasChanges, content, title])

  // Set default mode based on screen size
  useEffect(() => {
    if (isMobileDevice()) {
      setEditorMode('edit')
    }
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // Handle slash commands
    const cursorPosition = e.target.selectionStart
    const textBeforeCursor = newContent.substring(0, cursorPosition)
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
    
    if (lastSlashIndex !== -1) {
      const textAfterSlash = textBeforeCursor.substring(lastSlashIndex + 1)
      const isAtStartOfLine = lastSlashIndex === 0 || textBeforeCursor[lastSlashIndex - 1] === '\n'
      
      if (isAtStartOfLine && !textAfterSlash.includes(' ') && !textAfterSlash.includes('\n')) {
        // Show slash dropdown
        setSlashQuery(textAfterSlash)
        setShowSlashDropdown(true)
        
        // Calculate position for dropdown
        const textarea = e.target
        const rect = textarea.getBoundingClientRect()
        const scrollTop = textarea.scrollTop
        
        // Estimate position (simplified)
        setSlashPosition({
          top: rect.top + 30,
          left: rect.left + 10
        })
      } else {
        setShowSlashDropdown(false)
      }
    } else {
      setShowSlashDropdown(false)
    }
  }

  // Enhanced handleInput - auto-scroll disabled on desktop, enabled on mobile
  const handleWysiwygInput = () => {
    if (!wysiwygEditorRef.current) return
    
    // Update hasChanges first
    if (!hasChanges) {
      setHasChanges(true)
    }
    
    // Mark as typing to prevent external updates
    setIsTyping(true)
    
    // Get current HTML and convert to markdown
    const html = wysiwygEditorRef.current.innerHTML
    const markdown = htmlToMarkdown(html)
    
    // Update both content states
    setContent(markdown)
    setWysiwygContent(html)
    
    // Clear typing state after a delay
    setTimeout(() => setIsTyping(false), 500)
    
    // Auto-scroll only for mobile - desktop users prefer manual control
    if (isMobileDevice()) {
      setTimeout(() => {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          const container = containerRef.current
          
          if (container) {
            const containerRect = container.getBoundingClientRect()
            const scrollTop = container.scrollTop
            
            // Enhanced mobile scroll logic
            const cursorTopRelativeToContainer = rect.top - containerRect.top
            const cursorBottomRelativeToContainer = rect.bottom - containerRect.top
            
            const topBuffer = 60
            const bottomBuffer = 120
            
            const needsScroll = cursorTopRelativeToContainer < topBuffer || 
                               cursorBottomRelativeToContainer > containerRect.height - bottomBuffer

            if (needsScroll) {
              let newScrollTop
              if (cursorTopRelativeToContainer < topBuffer) {
                newScrollTop = scrollTop + cursorTopRelativeToContainer - topBuffer
              } else {
                const idealPosition = containerRect.height * 0.7
                newScrollTop = scrollTop + cursorBottomRelativeToContainer - idealPosition
              }

              container.scrollTo({
                top: Math.max(0, newScrollTop),
                behavior: 'smooth'
              })
            }
          }
        }
      }, 8)
    }
    
    // Slash command detection
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
    
    const textContent = node.textContent || ''
    const textBeforeCursor = textContent.substring(0, cursorPosition)
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
    
    if (lastSlashIndex === -1) {
      setShowSlashDropdown(false)
      return
    }
    
    // Check if slash is at beginning of line or after whitespace
    const isAtStartOfLine = lastSlashIndex === 0 || textBeforeCursor[lastSlashIndex - 1] === '\n' || /\s/.test(textBeforeCursor[lastSlashIndex - 1])
    
    if (!isAtStartOfLine) {
      setShowSlashDropdown(false)
      return
    }
    
    const query = textBeforeCursor.substring(lastSlashIndex + 1)
    if (query.includes(' ') || query.includes('\n')) {
      setShowSlashDropdown(false)
      return
    }
    
    setSlashQuery(query)
    
    const rect = range.getBoundingClientRect()
    setSlashPosition({ 
      top: rect.bottom + window.scrollY + 5, 
      left: rect.left + window.scrollX 
    })
    setShowSlashDropdown(true)
  }

  // Update WYSIWYG editor when content changes externally, but not while typing
  useEffect(() => {
    if (wysiwygEditorRef.current && editorMode === 'edit' && !isTyping) {
      const editor = wysiwygEditorRef.current
      const currentHtml = editor.innerHTML
      const expectedHtml = markdownToHtml(content)
      
      // Only update if content actually changed to avoid cursor jumping
      if (currentHtml !== expectedHtml && wysiwygContent !== expectedHtml) {
        // Save detailed cursor position before updating
        const selection = window.getSelection()
        let savedCursorInfo = null
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          if (editor.contains(range.startContainer)) {
            // Get all text content and calculate exact position
            const fullText = editor.textContent || ''
            const preCaretRange = range.cloneRange()
            preCaretRange.selectNodeContents(editor)
            preCaretRange.setEnd(range.startContainer, range.startOffset)
            const caretOffset = preCaretRange.toString().length
            
            savedCursorInfo = {
              offset: caretOffset,
              totalLength: fullText.length,
              beforeText: fullText.substring(Math.max(0, caretOffset - 10), caretOffset),
              afterText: fullText.substring(caretOffset, Math.min(fullText.length, caretOffset + 10))
            }
          }
        }
        
        // Update HTML content
        editor.innerHTML = expectedHtml
        setWysiwygContent(expectedHtml)
        
        // Restore cursor position using improved method
        if (savedCursorInfo) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            const newSelection = window.getSelection()
            if (!newSelection) return
            
            const newFullText = editor.textContent || ''
            let targetOffset = savedCursorInfo.offset
            
            // Verify context to ensure we're placing cursor in right spot
            if (targetOffset <= newFullText.length) {
              const newBefore = newFullText.substring(Math.max(0, targetOffset - 10), targetOffset)
              const newAfter = newFullText.substring(targetOffset, Math.min(newFullText.length, targetOffset + 10))
              
              // If context doesn't match exactly, try to find best position
              if (newBefore !== savedCursorInfo.beforeText || newAfter !== savedCursorInfo.afterText) {
                // Look for the position where context matches
                for (let i = Math.max(0, targetOffset - 20); i <= Math.min(newFullText.length, targetOffset + 20); i++) {
                  const testBefore = newFullText.substring(Math.max(0, i - 10), i)
                  const testAfter = newFullText.substring(i, Math.min(newFullText.length, i + 10))
                  
                  if (testBefore === savedCursorInfo.beforeText && testAfter === savedCursorInfo.afterText) {
                    targetOffset = i
                    break
                  }
                }
              }
            }
            
            // Safely set cursor position
            try {
              let currentOffset = 0
              const walker = document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                null
              )
              
              let node: Node | null
              while ((node = walker.nextNode())) {
                const textContent = node.textContent || ''
                const nodeLength = textContent.length
                
                if (currentOffset + nodeLength >= targetOffset) {
                  const range = document.createRange()
                  const offsetInNode = Math.min(targetOffset - currentOffset, nodeLength)
                  
                  range.setStart(node, offsetInNode)
                  range.collapse(true)
                  
                  newSelection.removeAllRanges()
                  newSelection.addRange(range)
                  break
                } else {
                  currentOffset += nodeLength
                }
              }
            } catch (error) {
              console.warn('Failed to restore cursor position:', error)
              // Fallback: place cursor at end
              try {
                const range = document.createRange()
                range.selectNodeContents(editor)
                range.collapse(false)
                newSelection.removeAllRanges()
                newSelection.addRange(range)
              } catch (fallbackError) {
                console.warn('Fallback cursor positioning also failed:', fallbackError)
              }
            }
          })
        }
      }
    }
  }, [content, editorMode, isTyping])

  // Initialize WYSIWYG content when note changes
  useEffect(() => {
    if (wysiwygEditorRef.current && note.id) {
      const expectedHtml = markdownToHtml(note.content || '')
      wysiwygEditorRef.current.innerHTML = expectedHtml
      setWysiwygContent(expectedHtml)
    }
  }, [note.id])

  const handleSave = async () => {
    if (!hasChanges || isSaving) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      await onSave(note.id, title, content)
      setSaveSuccess(true)
      setHasChanges(false)
      
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
      if (!confirmCancel) return
    }
    onCancel()
  }

  const handleSlashCommandSelect = (command: SlashCommand) => {
    if (!wysiwygEditorRef.current) return
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const commandAction = command.action()
    
    // Get the text content before cursor to find slash
    const textContent = wysiwygEditorRef.current.textContent || ''
    const cursorPosition = range.startOffset
    const textBeforeCursor = textContent.substring(0, cursorPosition)
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
    
    if (lastSlashIndex !== -1) {
      // Remove the slash and query text
      const beforeSlash = textContent.substring(0, lastSlashIndex)
      const afterCursor = textContent.substring(cursorPosition)
      
      // Create new content with the command
      const newMarkdown = beforeSlash + commandAction.before + commandAction.after + afterCursor
      setContent(newMarkdown)
      
      // Update the editor
      setTimeout(() => {
        if (wysiwygEditorRef.current) {
          wysiwygEditorRef.current.innerHTML = markdownToHtml(newMarkdown)
          // Focus and set cursor position
          wysiwygEditorRef.current.focus()
        }
      }, 0)
    }
    
    setShowSlashDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    
    
    if (showSlashDropdown && (e.key === 'Escape' || e.key === 'Backspace')) {
      setShowSlashDropdown(false)
    }
  }

  // Synchronized scrolling for split view
  const handleEditorScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || editorMode !== 'split' || !previewRef.current) return
    
    const editor = e.currentTarget
    const preview = previewRef.current
    
    // Calculate scroll percentage
    const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
    
    // Apply to preview
    const previewScrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight)
    preview.scrollTop = previewScrollTop
  }

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || editorMode !== 'split' || !wysiwygEditorRef.current) return
    
    const preview = e.currentTarget
    const editor = wysiwygEditorRef.current
    
    // Calculate scroll percentage
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
    
    // Apply to editor
    const editorScrollTop = scrollPercentage * (editor.scrollHeight - editor.clientHeight)
    editor.scrollTop = editorScrollTop
  }

  const handleNoteClick = (clickedNote: Note) => {
    if (onNoteClick) {
      onNoteClick(clickedNote)
    }
  }

  const renderModeButton = (mode: EditorMode, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setEditorMode(mode)}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
        editorMode === mode
          ? 'active bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )

  return (
    <div className="editor-container-with-fixed-header note-editor-mobile h-full flex flex-col">
      <SlashCommandDropdown
        isVisible={showSlashDropdown}
        position={slashPosition}
        onSelect={handleSlashCommandSelect}
        onClose={() => setShowSlashDropdown(false)}
        searchQuery={slashQuery}
      />

      {/* Enhanced Header */}
      <div 
        ref={headerRef}
        className="fixed-header-alternative px-3 lg:px-4 py-2 lg:py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200/60"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Title Section - Mobile layout */}
          <div className="flex-1 min-w-0 lg:hidden">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full text-lg font-semibold text-gray-900 border-none focus:outline-none bg-transparent placeholder-gray-400 mb-1"
              placeholder="Enter note title..."
            />
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  hasChanges ? 'bg-orange-400 animate-pulse' : 'bg-green-400'
                }`}></div>
                <span className="text-xs">
                  {hasChanges ? 'Unsaved' : 'Saved'}
                </span>
              </div>
            </div>
          </div>

          {/* Title Section - Desktop layout */}
          <div className="hidden lg:flex flex-1 items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="flex-1 text-xl font-semibold text-gray-900 border-none focus:outline-none bg-transparent placeholder-gray-400"
                placeholder="Enter note title..."
              />
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    hasChanges ? 'bg-orange-400 animate-pulse' : 'bg-green-400'
                  }`}></div>
                  <span className="text-sm">
                    {hasChanges ? 'Unsaved changes' : 'All changes saved'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-s font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50"
              disabled={isSaving}
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cancel</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-s font-medium text-white rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 transition-all duration-200 ${
                !hasChanges 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : saveSuccess 
                    ? 'bg-green-500 focus:ring-green-500' 
                    : isSaving 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
              title={hasChanges ? "Save changes (Ctrl+S)" : "No changes to save"}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 animate-bounce" />
                  <span className="hidden sm:inline">Saved!</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 ${
                !hasChanges 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : saveSuccess 
                    ? 'bg-green-500 focus:ring-green-500' 
                    : isSaving 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
              title={hasChanges ? "Save changes (Ctrl+S)" : "No changes to save"}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckIcon className="w-4 h-4 animate-bounce" />
                  Saved!
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden" 
      >
        {/* Mobile Mode Selector */}
        <div className="lg:hidden flex editor-mode-toggle m-3">
          {renderModeButton('edit', <CodeBracketIcon className="h-4 w-4" />, 'Edit')}
          {renderModeButton('preview', <EyeIcon className="h-4 w-4" />, 'Preview')}
        </div>

        {/* Content Based on Mode */}
        {editorMode === 'edit' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden px-3 lg:px-6">
              <div
                ref={wysiwygEditorRef}
                contentEditable
                onInput={handleWysiwygInput}
                onKeyDown={handleKeyDown}
                onScroll={handleEditorScroll}
                className="wysiwyg-editor w-full h-full focus:outline-none p-3 lg:p-6 prose prose-sm lg:prose-base max-w-none dark:prose-invert prose-enhanced-reading overflow-y-auto overflow-x-hidden"
                style={{ 
                  minHeight: '100%',
                  maxHeight: '100%',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
                suppressContentEditableWarning={true}
              />
            </div>
          </div>
        )}

        {/* {editorMode === 'preview' && (
          <div className="h-full overflow-auto px-6 py-8 lg:px-12 lg:py-10">
            <div className="max-w-4xl mx-auto">
              <MarkdownPreview
                content={content}
                availableNotes={availableNotes}
                onNoteClick={handleNoteClick}
                className="max-w-none prose-enhanced-reading"
              />
            </div>
          </div>
        )} */}
      </div>
      
      {/* Floating Action Buttons for Mobile */}
      <FloatingActionButtons 
        onSave={handleSave}
        onCancel={handleCancel}
        hasChanges={hasChanges}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
      />
    </div>
  )
}
