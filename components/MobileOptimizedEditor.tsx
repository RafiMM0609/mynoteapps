'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useMobileOptimization } from '@/hooks/useMobileOptimization'
import { PencilSquareIcon, DocumentTextIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import FloatingActionButtons from './FloatingActionButtons'
import SlashCommandDropdown from './SlashCommandDropdown'

interface MobileOptimizedEditorProps {
  content: string
  onChange: (newContent: string) => void
  onSave: () => void
  onCancel: () => void
  hasChanges: boolean
  isSaving?: boolean
  saveSuccess?: boolean
  renderPreview: (content: string) => React.ReactNode
  title: string
}

export default function MobileOptimizedEditor({
  content,
  onChange,
  onSave,
  onCancel,
  hasChanges,
  isSaving = false,
  saveSuccess = false,
  renderPreview,
  title
}: MobileOptimizedEditorProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showTextTools, setShowTextTools] = useState(false)
  const [showSlashDropdown, setShowSlashDropdown] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  
  // Mobile list hint state
  const [showMobileListHint, setShowMobileListHint] = useState(false)
  const [lastEnterTime, setLastEnterTime] = useState(0)
  
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Helper function to show mobile hint
  const showMobileHint = (message: string) => {
    if (isMobile) {
      setShowMobileListHint(true)
      setTimeout(() => setShowMobileListHint(false), 2000)
    }
  }
  
  // Mobile optimization hook
  const { 
    isMobile, 
    touchActive, 
    swipeGesture, 
    textSelectionActive,
    attachTouchHandlers, 
    enhanceTextSelection,
    optimizeFloatingElements
  } = useMobileOptimization({
    enableSwipeGestures: true,
    enableTextSelectionHelper: true,
    swipeThreshold: 60,
    textSelectionTimeout: 800
  })
  
  // Handle swipe gestures
  useEffect(() => {
    if (swipeGesture.direction && swipeGesture.distance > 80) {
      if (swipeGesture.direction === 'left' && viewMode === 'edit') {
        setViewMode('preview')
      } else if (swipeGesture.direction === 'right' && viewMode === 'preview') {
        setViewMode('edit')
      }
    }
  }, [swipeGesture, viewMode])
  
  // Attach touch handlers to container
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = attachTouchHandlers(containerRef.current)
      return cleanup
    }
  }, [attachTouchHandlers])
  
  // Enhance text selection
  useEffect(() => {
    if (editorRef.current) {
      const cleanup = enhanceTextSelection(editorRef.current)
      return cleanup
    }
  }, [enhanceTextSelection])
  
  // Optimize floating elements visibility
  useEffect(() => {
    const cleanup = optimizeFloatingElements(setShowTextTools)
    return cleanup
  }, [optimizeFloatingElements])
  
  // Handle text selection behavior
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editorRef.current) return
      
      const selection = window.getSelection()
      if (selection && selection.toString().length > 0) {
        setShowTextTools(true)
      }
    }
    
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [])
  
  // Handle list enter behavior and slash commands
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const textarea = editorRef.current
    if (!textarea) return

    // Handle Enter key for list exit behavior (matching desktop behavior)
    if (e.key === 'Enter' && !e.shiftKey) {
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = content.substring(0, cursorPos)
      const lines = textBeforeCursor.split('\n')
      const currentLine = lines[lines.length - 1]
      
      // Check if current line is an empty list item
      const listItemRegex = /^(\s*)([-*+]|\d+\.)\s*$/
      const listMatch = currentLine.match(listItemRegex)
      
      if (listMatch) {
        // Empty list item - exit the list immediately (consistent with desktop)
        e.preventDefault()
        
        const lineStart = textBeforeCursor.lastIndexOf('\n') + 1
        const lineEnd = cursorPos
        const textAfterCursor = content.substring(cursorPos)
        
        // Remove the empty list marker and create new line
        const newContent = 
          content.substring(0, lineStart) + 
          '\n' + 
          textAfterCursor
        
        onChange(newContent)
        
        // Position cursor at the new empty line
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(lineStart + 1, lineStart + 1)
        }, 10)
        
        return
      }
      
      // Check if current line is a list item (but not empty) or cursor is inside a list item
      const listContinueRegex = /^(\s*)([-*+]|\d+\.)\s*/
      const continueMatch = currentLine.match(listContinueRegex)
      
      if (continueMatch) {
        // For mobile: Enhanced double-tap detection for exiting lists
        if (isMobile) {
          const currentTime = Date.now()
          
          // If double Enter within 500ms on mobile, exit list
          if (currentTime - lastEnterTime < 500) {
            e.preventDefault()
            
            // Exit the list - add empty line after current list item
            const textAfterCursor = content.substring(cursorPos)
            const newContent = 
              content.substring(0, cursorPos) + 
              '\n\n' + 
              textAfterCursor
            
            onChange(newContent)
            
            // Position cursor at the new empty line
            setTimeout(() => {
              textarea.focus()
              textarea.setSelectionRange(cursorPos + 2, cursorPos + 2)
            }, 10)
            
            // Reset timestamp
            setLastEnterTime(0)
            return
          } else {
            // Store timestamp for double-tap detection and show hint
            setLastEnterTime(currentTime)
            showMobileHint("Press Enter again to exit list")
          }
        }
        
        // Normal list continuation behavior
        e.preventDefault()
        
        const indent = continueMatch[1]
        let marker = continueMatch[2]
        
        // For numbered lists, find the correct next number by scanning previous lines
        if (/^\d+\.$/.test(marker)) {
          // Find the next number by looking at the current list context
          let nextNumber = 1
          
          // Look for the highest number in the current list level
          const currentIndent = indent.length
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i]
            const lineMatch = line.match(/^(\s*)(\d+)\.\s*/)
            if (lineMatch) {
              const lineIndent = lineMatch[1].length
              const lineNumber = parseInt(lineMatch[2])
              
              // If this is the same indent level, use the next number
              if (lineIndent === currentIndent) {
                nextNumber = lineNumber + 1
                break
              }
              // If we hit a higher level (less indent), we're starting a new sub-list
              if (lineIndent < currentIndent) {
                nextNumber = 1
                break
              }
            }
            // If we hit a non-numbered line at same or higher level, stop
            const nonNumberMatch = line.match(/^(\s*)([-*+])\s*/)
            if (nonNumberMatch && nonNumberMatch[1].length <= currentIndent) {
              break
            }
            // If we hit an empty line or start of content, stop
            if (line.trim() === '' || i === 0) {
              break
            }
          }
          
          marker = `${nextNumber}.`
        }
        
        const newListItem = `\n${indent}${marker} `
        const textAfterCursor = content.substring(cursorPos)
        
        const newContent = 
          content.substring(0, cursorPos) + 
          newListItem + 
          textAfterCursor
        
        onChange(newContent)
        
        // Position cursor after the new list marker
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(cursorPos + newListItem.length, cursorPos + newListItem.length)
        }, 10)
        
        return
      }
    }

    // Handle slash commands
    if (e.key === '/') {
      const cursorPos = textarea.selectionStart
      setCursorPosition(cursorPos)
      
      // Try to calculate position based on cursor
      // This is simplified - in a real implementation you'd calculate exact position
      const lineBreaks = content.substring(0, cursorPos).split('\n').length - 1
      const lineHeight = 24 // approximate line height
      
      setSlashPosition({
        top: textarea.offsetTop + lineBreaks * lineHeight + 30, 
        left: textarea.offsetLeft + 20
      })
      
      setSlashQuery('')
      setShowSlashDropdown(true)
    } else if (e.key === 'Escape') {
      setShowSlashDropdown(false)
      setShowTextTools(false)
    }
  }
  
  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    onChange(newContent)
    
    // Update cursor position
    setCursorPosition(e.target.selectionStart)
    
    // Check for slash command
    if (showSlashDropdown) {
      const textBeforeCursor = newContent.substring(0, e.target.selectionStart)
      const lastSlashPos = textBeforeCursor.lastIndexOf('/')
      
      if (lastSlashPos >= 0) {
        const query = textBeforeCursor.substring(lastSlashPos + 1)
        setSlashQuery(query)
      } else {
        setShowSlashDropdown(false)
      }
    }
  }
  
  // Handle slash command selection
  const handleSlashCommand = (command: any) => {
    if (!editorRef.current) return
    
    const textarea = editorRef.current
    const curPos = textarea.selectionStart
    const textBeforeCursor = content.substring(0, curPos)
    const lastSlashPos = textBeforeCursor.lastIndexOf('/')
    
    if (lastSlashPos >= 0) {
      const textAfterCursor = content.substring(curPos)
      const { before, after } = command.action()
      
      // Remove slash and replace with command
      const newContent = 
        textBeforeCursor.substring(0, lastSlashPos) + 
        before + 
        textAfterCursor + 
        after
      
      onChange(newContent)
      
      // Set cursor position between before and after
      const newCursorPos = lastSlashPos + before.length
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 10)
    }
    
    setShowSlashDropdown(false)
  }
  
  return (
    <div 
      ref={containerRef}
      className={`mobile-optimized-editor ${isMobile ? 'is-mobile' : ''} ${textSelectionActive ? 'text-selection-active' : ''}`}
    >
      <div className="mobile-editor-header">
        <h2 className="truncate">{title}</h2>
        
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
            aria-label="Edit mode"
          >
            <PencilSquareIcon className="w-5 h-5" />
            <span>Edit</span>
          </button>
          <button
            className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            aria-label="Preview mode"
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span>Preview</span>
          </button>
        </div>
      </div>
      
      <div className="mobile-editor-swipe-hint">
        {viewMode === 'edit' ? (
          <span>Swipe left for preview <ChevronLeftIcon className="w-4 h-4" /></span>
        ) : (
          <span><ChevronRightIcon className="w-4 h-4" /> Swipe right to edit</span>
        )}
      </div>
      
      <div className="mobile-editor-content">
        {viewMode === 'edit' ? (
          <textarea
            ref={editorRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="mobile-textarea"
            placeholder="Start typing..."
          />
        ) : (
          <div className="mobile-preview">
            {renderPreview(content)}
          </div>
        )}
      </div>
      
      {/* Mobile text selection tools */}
      {showTextTools && viewMode === 'edit' && (
        <div className="mobile-text-tools">
          <button 
            onClick={() => {
              if (!editorRef.current) return
              
              const textarea = editorRef.current
              const start = textarea.selectionStart
              const end = textarea.selectionEnd
              
              if (start !== end) {
                const selectedText = content.substring(start, end)
                const newContent = 
                  content.substring(0, start) + 
                  `**${selectedText}**` + 
                  content.substring(end)
                
                onChange(newContent)
                textarea.focus()
                textarea.setSelectionRange(start + 2, end + 2)
              }
            }}
          >
            Bold
          </button>
          <button 
            onClick={() => {
              if (!editorRef.current) return
              
              const textarea = editorRef.current
              const start = textarea.selectionStart
              const end = textarea.selectionEnd
              
              if (start !== end) {
                const selectedText = content.substring(start, end)
                const newContent = 
                  content.substring(0, start) + 
                  `*${selectedText}*` + 
                  content.substring(end)
                
                onChange(newContent)
                textarea.focus()
                textarea.setSelectionRange(start + 1, end + 1)
              }
            }}
          >
            Italic
          </button>
          <button 
            onClick={() => {
              if (!editorRef.current) return
              
              const textarea = editorRef.current
              const start = textarea.selectionStart
              const end = textarea.selectionEnd
              
              if (start !== end) {
                const selectedText = content.substring(start, end)
                const newContent = 
                  content.substring(0, start) + 
                  `[${selectedText}](url)` + 
                  content.substring(end)
                
                onChange(newContent)
                textarea.focus()
                textarea.setSelectionRange(start + selectedText.length + 3, start + selectedText.length + 6)
              }
            }}
          >
            Link
          </button>
        </div>
      )}
      
      {/* Slash command dropdown */}
      {showSlashDropdown && (
        <SlashCommandDropdown
          isVisible={showSlashDropdown}
          position={slashPosition}
          onSelect={handleSlashCommand}
          onClose={() => setShowSlashDropdown(false)}
          searchQuery={slashQuery}
        />
      )}
      
      {/* Mobile-optimized floating action buttons */}
      <FloatingActionButtons
        onSave={onSave}
        onCancel={onCancel}
        hasChanges={hasChanges}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
      />
      
      {/* Mobile list hint */}
      {showMobileListHint && (
        <div className="mobile-list-hint show">
          Press Enter again to exit list
        </div>
      )}
    </div>
  )
}
