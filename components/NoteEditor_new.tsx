'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
import type { Note } from '../lib/supabase'
import SlashCommandDropdown from './SlashCommandDropdown'
import InlineNoteLinking from './InlineNoteLinking'
import NoteLinkRenderer from './NoteLinkRenderer'
import FloatingActionButtons from './FloatingActionButtons'
import { useNoteLinkDetection } from '../hooks/useNoteLinkParser'
import { useHeaderVisibility, useScrollDetection } from '../hooks/useScrollDetection'

interface NoteEditorProps {
  note: Note
  onSave: (noteId: string, title: string, content: string) => void
  onCancel: () => void
  availableNotes?: Note[]
  onNoteClick?: (note: Note) => void
  onCreateNewNote?: (title: string) => void
}

export default function NoteEditor({ 
  note, 
  onSave, 
  onCancel, 
  availableNotes = [], 
  onNoteClick, 
  onCreateNewNote 
}: NoteEditorProps) {  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const turndownService = useRef(new TurndownService())

  // Slash command states
  const [showSlashDropdown, setShowSlashDropdown] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [slashStartPos, setSlashStartPos] = useState(0)
  const [activeNode, setActiveNode] = useState<Node | null>(null)

  // Note linking detection
  const noteLinkDetection = useNoteLinkDetection(content, cursorPosition)
  
  // Header visibility detection + Backup positioning for old browsers
  const { isHeaderVisible, headerRef } = useHeaderVisibility()
  const { isScrolledPastThreshold, containerRef } = useScrollDetection({ threshold: 150 })
  
  // Force FAB visibility state for edge cases
  const [forceShowFAB, setForceShowFAB] = useState(false)
  
  // Status bar visibility state
  const [showStatusBar, setShowStatusBar] = useState(true)
  const [isStatusBarFloating, setIsStatusBarFloating] = useState(false)
  
  // Backup positioning system for browsers with fixed positioning issues
  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    // Check if browser properly supports fixed positioning
    const testElement = document.createElement('div')
    testElement.style.position = 'fixed'
    testElement.style.top = '0'
    document.body.appendChild(testElement)
    
    const rect = testElement.getBoundingClientRect()
    const supportsFixed = rect.top === 0
    
    document.body.removeChild(testElement)

    if (!supportsFixed) {
      // Fallback: Manually position header on scroll
      const handleScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        header.style.transform = `translateY(${scrollTop}px)`
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Emergency FAB visibility system - ensures FAB shows after long content
  useEffect(() => {
    const checkFABVisibility = () => {
      const scrollableContent = document.querySelector('.scrollable-editor-content') as HTMLElement
      if (!scrollableContent) return

      const scrollHeight = scrollableContent.scrollHeight
      const clientHeight = scrollableContent.clientHeight
      const scrollTop = scrollableContent.scrollTop

      // If content is taller than 2 screen heights, force show FAB
      const isVeryLongContent = scrollHeight > clientHeight * 2
      
      // If user has scrolled down significantly, show FAB
      const hasScrolledSignificantly = scrollTop > clientHeight * 0.5

      setForceShowFAB(isVeryLongContent || hasScrolledSignificantly)
    }

    // Check immediately and on scroll
    const scrollableContent = document.querySelector('.scrollable-editor-content')
    if (scrollableContent) {
      checkFABVisibility()
      scrollableContent.addEventListener('scroll', checkFABVisibility, { passive: true })
      
      // Emergency timeout - force show FAB after 2 seconds if content is very long
      const emergencyTimeout = setTimeout(() => {
        const scrollHeight = scrollableContent.scrollHeight
        const clientHeight = scrollableContent.clientHeight
        
        if (scrollHeight > clientHeight * 1.5) {
          console.log('Emergency FAB activation for long content')
          setForceShowFAB(true)
        }
      }, 2000)
      
      return () => {
        scrollableContent.removeEventListener('scroll', checkFABVisibility)
        clearTimeout(emergencyTimeout)
      }
    }

    // Also check on window scroll as fallback
    window.addEventListener('scroll', checkFABVisibility, { passive: true })
    return () => window.removeEventListener('scroll', checkFABVisibility)
  }, [])

  // Additional safety check - force FAB on content changes if content is long
  useEffect(() => {
    if (content.length > 2000) { // If content is very long (>2000 chars)
      const timer = setTimeout(() => {
        setForceShowFAB(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [content])

  useEffect(() => {
    setContent(note.content || '')
    if (editorRef.current) {
      editorRef.current.innerHTML = renderMarkdown(note.content)
    }
  }, [note.content])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges && !isSaving) {
          handleSave()
        }
      }
      // Escape to cancel
      if (e.key === 'Escape' && hasChanges) {
        e.preventDefault()
        if (confirm('Are you sure you want to discard your changes?')) {
          handleCancel()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, isSaving])
  const handleSave = async () => {
    if (editorRef.current) {
      setIsSaving(true)
      try {
        const html = editorRef.current.innerHTML
        const markdown = turndownService.current.turndown(html)
        await onSave(note.id, title, markdown)
        
        setHasChanges(false)
        setSaveSuccess(true)
        
        // Reset success state after animation
        setTimeout(() => setSaveSuccess(false), 600)
      } catch (error) {
        console.error('Save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleCancel = () => {
    if (hasChanges && !confirm('Are you sure you want to discard your changes?')) {
      return
    }
    onCancel()
  }

  // Handle note link selection
  const handleNoteLinkSelect = (selectedNote: Note) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const node = range.startContainer
    
    if (node.nodeType !== Node.TEXT_NODE) return

    const textContent = node.textContent || ''
    const cursorPos = range.startOffset
    
    // Find the [[ pattern before cursor
    const beforeCursor = textContent.substring(0, cursorPos)
    const openBrackets = beforeCursor.lastIndexOf('[[')
    
    if (openBrackets === -1) return

    // Replace the incomplete note link with the complete one
    const beforeLink = textContent.substring(0, openBrackets)
    const afterCursor = textContent.substring(cursorPos)
    const newText = beforeLink + `[[${selectedNote.title}]]` + afterCursor
    
    node.textContent = newText
    
    // Position cursor after the note link
    const newCursorPos = openBrackets + `[[${selectedNote.title}]]`.length
    range.setStart(node, newCursorPos)
    range.setEnd(node, newCursorPos)
    
    // Update content state
    updateContentFromEditor()
    setHasChanges(true)
  }

  const handleCreateNewNoteFromLink = (noteTitle: string) => {
    if (onCreateNewNote) {
      onCreateNewNote(noteTitle)
    }
    
    // Also insert the link in the current note
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const node = range.startContainer
    
    if (node.nodeType !== Node.TEXT_NODE) return

    const textContent = node.textContent || ''
    const cursorPos = range.startOffset
    
    // Find the [[ pattern before cursor
    const beforeCursor = textContent.substring(0, cursorPos)
    const openBrackets = beforeCursor.lastIndexOf('[[')
    
    if (openBrackets === -1) return

    // Replace the incomplete note link with the complete one
    const beforeLink = textContent.substring(0, openBrackets)
    const afterCursor = textContent.substring(cursorPos)
    const newText = beforeLink + `[[${noteTitle}]]` + afterCursor
    
    node.textContent = newText
    
    // Position cursor after the note link
    const newCursorPos = openBrackets + `[[${noteTitle}]]`.length
    range.setStart(node, newCursorPos)
    range.setEnd(node, newCursorPos)
    
    updateContentFromEditor()
    setHasChanges(true)
  }

  const updateContentFromEditor = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      const markdown = turndownService.current.turndown(html)
      setContent(markdown)
      
      // Update cursor position
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        setCursorPosition(range.startOffset)
      }
    }
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

    // Update content and cursor position for note linking
    updateContentFromEditor()

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
    selection.addRange(range)    // Now, execute the appropriate formatting command.
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
      case 'notelink':
        // Insert note link format [[]]
        document.execCommand('insertHTML', false, '[[]]')
        // Position cursor between brackets
        const newSelection = window.getSelection()
        if (newSelection && newSelection.rangeCount > 0) {
          const newRange = newSelection.getRangeAt(0)
          newRange.setStart(newRange.startContainer, newRange.startOffset - 2)
          newRange.setEnd(newRange.startContainer, newRange.startOffset - 2)
          newSelection.removeAllRanges()
          newSelection.addRange(newRange)
        }
        break
      default:
        // If the command is not recognized, just delete the trigger text.
        document.execCommand('delete', false)
        break
    }

    // Clean up state
    setSlashQuery('')
    setActiveNode(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // If the slash command dropdown is visible, let it handle navigation and selection.
    if (showSlashDropdown && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
      // Prevent default editor behavior for these keys when dropdown is open,
      // as the dropdown's keydown listener will handle them.
      e.preventDefault();
      return;
    }

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
  // Smart status bar visibility management
  useEffect(() => {
    const handleStatusBarVisibility = () => {
      const isMobile = window.innerWidth <= 768
      const shouldFloat = isScrolledPastThreshold && !isMobile
      const shouldHide = isMobile && (!isHeaderVisible || isScrolledPastThreshold)
      
      setIsStatusBarFloating(shouldFloat)
      setShowStatusBar(!shouldHide)
    }
    
    handleStatusBarVisibility()
    window.addEventListener('resize', handleStatusBarVisibility)
    
    return () => window.removeEventListener('resize', handleStatusBarVisibility)
  }, [isScrolledPastThreshold, isHeaderVisible])

  return (
    <div ref={containerRef} className="editor-container-with-fixed-header note-editor-mobile">
      <SlashCommandDropdown
        isVisible={showSlashDropdown}
        position={slashPosition}
        onSelect={handleSlashCommandSelect}
        onClose={() => setShowSlashDropdown(false)}
        searchQuery={slashQuery}
      />

      {/* Inline Note Linking Dropdown */}
      {noteLinkDetection?.isInNoteLink && (
        <InlineNoteLinking
          isVisible={true}
          position={slashPosition}
          searchQuery={noteLinkDetection.searchQuery}
          availableNotes={availableNotes}
          currentNoteId={note.id}
          onSelect={handleNoteLinkSelect}
          onClose={() => {/* Note link detection will handle closing automatically */}}
          onCreateNewNote={onCreateNewNote ? handleCreateNewNoteFromLink : undefined}
        />
      )}

      {/* Enhanced Header - Better UX and Visual Hierarchy */}
      <div 
        ref={headerRef}
        className="fixed-header-alternative px-4 lg:px-6 py-4 lg:py-5 bg-white/95 backdrop-blur-sm border-b border-gray-200/60"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Title Section - More prominent and informative */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full text-xl lg:text-2xl font-bold text-gray-900 border-none focus:outline-none bg-transparent placeholder-gray-400 mb-2"
              placeholder="Enter note title..."
            />
            {/* Status indicators - Better visual feedback */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  hasChanges ? 'bg-orange-400 animate-pulse' : 'bg-green-400'
                }`}></div>
                <span className="font-medium">
                  {hasChanges ? 'Unsaved changes' : 'All changes saved'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                <kbd className="font-mono font-semibold">Ctrl+S</kbd>
                <span>to save</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons - Cleaner, more accessible design */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              disabled={isSaving}
              title="Cancel editing (Esc)"
            >
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm ${
                !hasChanges 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : saveSuccess 
                    ? 'bg-green-500 focus:ring-green-500 shadow-green-200' 
                    : isSaving 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-200'
              }`}
              title={hasChanges ? "Save changes (Ctrl+S)" : "No changes to save"}
            >
              <CheckIcon className={`w-4 h-4 ${isSaving ? 'animate-spin' : saveSuccess ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline font-medium">
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Note'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="scrollable-editor-content custom-scrollbar">
        <div
          ref={editorRef}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          contentEditable={true}
          suppressContentEditableWarning={true}
          className="prose max-w-none focus:outline-none p-6"
          style={{
            minHeight: 'calc(100vh - 200px)',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        />
        
        {/* Status bar - Smart visibility with better UX */}
        {showStatusBar && (
          <div className={`editor-status-bar auto-hide ${isStatusBarFloating ? 'floating' : ''} ${
            !showStatusBar ? 'mobile-hidden' : ''
          } flex items-center justify-between p-2 text-xs text-gray-600`}>
            <div className="flex items-center space-x-3">
              {/* Optional: Word count */}
              {content.length > 0 && (
                <span className="text-gray-500">
                  {content.split(' ').filter(word => word.length > 0).length} words
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isSaving && <span className="text-blue-600 animate-pulse">• Saving...</span>}
              {saveSuccess && <span className="text-green-600">• Saved</span>}
              {hasChanges && !isSaving && <span className="text-orange-600">• Unsaved changes</span>}
              <span className="text-xs opacity-60">Ctrl+S to save</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Buttons - Only show on mobile when header not visible */}
      {(!isHeaderVisible || isScrolledPastThreshold || forceShowFAB) && (
        <div className="lg:hidden">
          <FloatingActionButtons
            onSave={handleSave}
            onCancel={handleCancel}
            hasChanges={hasChanges}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
          />
        </div>
      )}
    </div>
  )
}
