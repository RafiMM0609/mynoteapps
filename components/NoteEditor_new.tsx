'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
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
import TypingPerformanceMonitor from './TypingPerformanceMonitor'
import VirtualizedDocument from './VirtualizedDocument'
import ProgressiveRendering from './ProgressiveRendering'
import markdownProcessor from '../lib/async-markdown'
import { useTypingPerformance } from '../hooks/useTypingPerformance'

// Safe sanitization function that works in both client and server environments
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: return as-is
    return html
  }
  return DOMPurify.sanitize(html)
}

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
}: NoteEditorProps) {  
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const turndownService = useRef(new TurndownService())
  
  // Performance monitoring state
  const [isLargeDocument, setIsLargeDocument] = useState(false)
  const [useVirtualization, setUseVirtualization] = useState(false)
  const [useProgressiveRendering, setUseProgressiveRendering] = useState(false)
  const [isRenderingMarkdown, setIsRenderingMarkdown] = useState(false)
  
  // Use typing performance monitor to detect lag
  const {
    isLagging,
    optimizationsApplied,
    forceOptimizations
  } = useTypingPerformance({
    threshold: 100,
    sampleSize: 10
  })

  // Slash command states
  const [showSlashDropdown, setShowSlashDropdown] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [slashStartPos, setSlashStartPos] = useState(0)
  const [activeNode, setActiveNode] = useState<Node | null>(null)

  // Mobile-aware list exit detection
  const [lastEnterTime, setLastEnterTime] = useState(0)
  const [showMobileListHint, setShowMobileListHint] = useState(false)
  
  // Helper function to detect if we're on mobile
  const isMobileDevice = () => {
    return window.innerWidth <= 768 || 'ontouchstart' in window || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Helper function to show mobile hint
  const showMobileHint = (message: string) => {
    if (isMobileDevice()) {
      setShowMobileListHint(true)
      setTimeout(() => setShowMobileListHint(false), 2000)
    }
  }

  // Cleanup mobile hint when component unmounts
  useEffect(() => {
    return () => {
      setShowMobileListHint(false)
    }
  }, [])

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

  // Check if content is large and enable optimizations
  useEffect(() => {
    // Content size thresholds
    const LARGE_CONTENT_THRESHOLD = 10000; // 10KB
    const VERY_LARGE_CONTENT_THRESHOLD = 50000; // 50KB
    
    // Check content size and apply appropriate optimizations
    const contentLength = (note.content || '').length;
    const isLarge = contentLength > LARGE_CONTENT_THRESHOLD;
    const isVeryLarge = contentLength > VERY_LARGE_CONTENT_THRESHOLD;
    
    setIsLargeDocument(isLarge);
    
    // Enable virtualization for very large documents or when lag is detected
    setUseVirtualization(isVeryLarge || (isLarge && (isLagging || optimizationsApplied)));
    
    // Enable progressive rendering for large documents that don't need full virtualization
    setUseProgressiveRendering(isLarge && !isVeryLarge && !useVirtualization);
    
  }, [note.content, isLagging, optimizationsApplied]);

  useEffect(() => {
    setContent(note.content || '')
    
    if (editorRef.current) {
      // For immediate responsiveness, use sync rendering first for smaller content
      if (note.content && note.content.length < 5000 && !optimizationsApplied) {
        editorRef.current.innerHTML = renderMarkdownSync(note.content)
      } else {
        // For larger content, show loading state and use async rendering
        editorRef.current.innerHTML = '<div class="text-gray-500">Rendering content...</div>'
        
        renderMarkdown(note.content).then(html => {
          if (editorRef.current) {
            editorRef.current.innerHTML = html
          }
        })
      }
    }
  }, [note.content, optimizationsApplied])

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

  const renderMarkdown = async (text: string) => {
    try {
      setIsRenderingMarkdown(true)
      
      // Use the optimized async markdown processor
      const html = await markdownProcessor.parse(text || '')
      setIsRenderingMarkdown(false)
      return html
    } catch (error) {
      console.error('Error rendering markdown:', error)
      setIsRenderingMarkdown(false)
      return text
    }
  }
  
  // Synchronous version for small content or when immediate rendering is needed
  const renderMarkdownSync = (text: string) => {
    try {
      const rawHtml = marked(text, { breaks: true, gfm: true }) as string
      return sanitizeHtml(rawHtml)
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return text
    }
  }
  // Helper function to scroll cursor into view with enhanced desktop experience
  const scrollCursorIntoView = () => {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const scrollableContent = document.querySelector('.scrollable-editor-content') as HTMLElement
    
    if (!scrollableContent) return

    const containerRect = scrollableContent.getBoundingClientRect()
    const scrollTop = scrollableContent.scrollTop
    
    // Calculate if cursor is out of view
    const cursorTopRelativeToContainer = rect.top - containerRect.top
    const cursorBottomRelativeToContainer = rect.bottom - containerRect.top
    
    // Enhanced buffer space - optimized for desktop viewing
    const isMobile = isMobileDevice()
    const topBuffer = isMobile ? 60 : 80  // Reduced buffer for more visible content
    const bottomBuffer = isMobile ? 120 : 160  // Balanced bottom buffer on desktop
    
    // Enhanced logic for better positioning
    const needsScroll = cursorTopRelativeToContainer < topBuffer || 
                       cursorBottomRelativeToContainer > containerRect.height - bottomBuffer

    if (needsScroll) {
      let newScrollTop

      if (cursorTopRelativeToContainer < topBuffer) {
        // Scrolling up - position cursor comfortably from top
        newScrollTop = scrollTop + cursorTopRelativeToContainer - topBuffer
      } else {
        // Scrolling down - position cursor in optimal viewing zone
        const idealPosition = isMobile ? containerRect.height * 0.7 : containerRect.height * 0.5
        newScrollTop = scrollTop + cursorBottomRelativeToContainer - idealPosition
      }

      scrollableContent.scrollTo({
        top: Math.max(0, newScrollTop),
        behavior: 'smooth'
      })
    }
  }

  // Enhanced handleInput - auto-scroll disabled on desktop, enabled on mobile
  const handleInput = () => {
    if (!hasChanges) {
      setHasChanges(true)
    }

    // Update content and cursor position for note linking
    updateContentFromEditor()

    // Auto-scroll only for mobile - desktop users prefer manual control
    if (isMobileDevice()) {
      const scrollDelay = 8 // Mobile gets auto-scroll for better UX
      setTimeout(() => {
        scrollCursorIntoView()
      }, scrollDelay)
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

    // Auto-scroll for navigation keys - only on mobile
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (isMobileDevice()) {
        const scrollDelay = 5 // Mobile navigation auto-scroll
        setTimeout(() => {
          scrollCursorIntoView()
        }, scrollDelay)
      }
      // Desktop: no auto-scroll for navigation keys - users prefer manual control
    }
    
    // Special handling for Enter key - auto-scroll only on mobile
    if (e.key === 'Enter') {
      if (isMobileDevice()) {
        const scrollDelay = 15 // Mobile gets Enter auto-scroll for better UX
        setTimeout(() => {
          scrollCursorIntoView()
        }, scrollDelay)
      }
      // Desktop: no auto-scroll for Enter key - users prefer manual control
    }
    
    // Auto-scroll for editing keys - only on mobile
    if (['Backspace', 'Delete'].includes(e.key)) {
      if (isMobileDevice()) {
        const scrollDelay = 8 // Mobile editing auto-scroll
        setTimeout(() => {
          scrollCursorIntoView()
        }, scrollDelay)
      }
      // Desktop: no auto-scroll for backspace/delete - users prefer manual control
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      let container = selection.getRangeAt(0).startContainer;

      // Find if we are inside a list item
      let parentListItem = null;
      let parentList = null;
      let currentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);
      
      while (currentElement && currentElement !== editorRef.current) {
        if (currentElement.nodeName === 'LI') {
          parentListItem = currentElement;
        }
        if (currentElement.nodeName === 'UL' || currentElement.nodeName === 'OL') {
          parentList = currentElement;
          break;
        }
        currentElement = currentElement.parentElement;
      }

      // Enhanced list handling for both desktop and mobile
      if (parentListItem && parentList) {
        // Check if the current list item is empty or only contains a single empty line
        const listItemText = parentListItem.textContent?.trim() || '';
        const isEmptyListItem = listItemText === '' || listItemText === '\n';
        
        if (isEmptyListItem) {
          // Exit list behavior - works for both desktop and mobile
          e.preventDefault();
          
          // Remove the empty list item
          parentListItem.remove();
          
          // Insert a new paragraph after the list
          const newParagraph = document.createElement('p');
          newParagraph.innerHTML = '<br>';
          
          // Insert after the list
          if (parentList.nextSibling) {
            parentList.parentNode?.insertBefore(newParagraph, parentList.nextSibling);
          } else {
            parentList.parentNode?.appendChild(newParagraph);
          }
          
          // Set cursor in the new paragraph
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(newParagraph, 0);
          range.setEnd(newParagraph, 0);
          sel?.removeAllRanges();
          sel?.addRange(range);
          
          // Auto-scroll after list exit - only on mobile
          if (isMobileDevice()) {
            const scrollDelay = 20 // Mobile list exit auto-scroll
            setTimeout(() => {
              scrollCursorIntoView()
            }, scrollDelay)
          }
          // Desktop: no auto-scroll after list exit - users prefer manual control
          
          return;
        } else if (isMobileDevice()) {
          // Enhanced mobile behavior: Double-tap detection for exiting lists
          const currentTime = Date.now();
          
          // If double Enter within 500ms on mobile, exit list
          if (currentTime - lastEnterTime < 500) {
            e.preventDefault();
            
            // Create new paragraph after list
            const newParagraph = document.createElement('p');
            newParagraph.innerHTML = '<br>';
            
            if (parentList.nextSibling) {
              parentList.parentNode?.insertBefore(newParagraph, parentList.nextSibling);
            } else {
              parentList.parentNode?.appendChild(newParagraph);
            }
            
            // Set cursor in new paragraph
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStart(newParagraph, 0);
            range.setEnd(newParagraph, 0);
            sel?.removeAllRanges();
            sel?.addRange(range);
            
            // Reset timestamp
            setLastEnterTime(0);
            return;
          } else {
            // Store timestamp for double-tap detection
            setLastEnterTime(currentTime);
            // Show hint to user on mobile
            showMobileHint("Press Enter again to exit list");
          }
        }
        
        // Normal list behavior - let browser handle new list item creation
        return;
      }

      // Enhanced desktop Enter behavior for better editing experience
      if (!isMobileDevice()) {
        // On desktop, use improved behavior for better cursor positioning
        e.preventDefault();
        
        // Get current selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Create a paragraph element for better structure
          const newParagraph = document.createElement('p');
          newParagraph.innerHTML = '<br>';
          
          // Insert the new paragraph
          range.deleteContents();
          range.insertNode(newParagraph);
          
          // Position cursor at the start of the new paragraph
          range.setStart(newParagraph, 0);
          range.setEnd(newParagraph, 0);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Desktop: no auto-scroll after Enter - users prefer manual control
        }
      } else {
        // Mobile behavior - use insertHTML for consistency
        e.preventDefault();
        document.execCommand('insertHTML', false, '<div><br></div>');
      }
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

      {/* Enhanced Header - Compact and Efficient Design */}
      <div 
        ref={headerRef}
        className="fixed-header-alternative px-3 lg:px-4 py-2 lg:py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200/60"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Title Section - Mobile layout (original) */}
          <div className="flex-1 min-w-0 lg:hidden">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full text-lg font-semibold text-gray-900 border-none focus:outline-none bg-transparent placeholder-gray-400 mb-1"
              placeholder="Enter note title..."
            />
            {/* Mobile status indicators */}
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

          {/* Desktop layout - Title and status in same row */}
          <div className="hidden lg:flex flex-1 items-center gap-4">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="flex-1 text-xl font-semibold text-gray-900 border-none focus:outline-none bg-transparent placeholder-gray-400"
              placeholder="Enter note title..."
            />
            
            {/* Desktop status indicators */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  hasChanges ? 'bg-orange-400 animate-pulse' : 'bg-green-400'
                }`}></div>
                <span className="text-sm">
                  {hasChanges ? 'Unsaved changes' : 'All changes saved'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                <kbd className="font-mono text-xs">Ctrl+S</kbd>
              </div>
            </div>
          </div>
          
          {/* Action Buttons - Mobile only (desktop buttons moved below) */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-s font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50"
              disabled={isSaving}
              title="Cancel editing (Esc)"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-s font-medium text-white rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 transition-all duration-200 ${
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
              <CheckIcon className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : saveSuccess ? 'animate-bounce' : ''}`} />
            </button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50"
              disabled={isSaving}
              title="Cancel editing (Esc)"
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
              <CheckIcon className={`w-4 h-4 ${isSaving ? 'animate-spin' : saveSuccess ? 'animate-bounce' : ''}`} />
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area - Optimized space with very compact header */}
      <div 
        className="scrollable-editor-content custom-scrollbar overflow-y-auto" 
        style={{ 
          paddingTop: '0.5rem', // Add small padding to prevent content overlap
          paddingBottom: '6rem' // Extra padding for mobile footer
        }}
      >
        {/* Performance Monitor */}
        <TypingPerformanceMonitor 
          onLagDetected={(isLagging) => {
            if (isLagging && !optimizationsApplied) {
              forceOptimizations()
            }
          }}
          showDebugInfo={false}
        />
        
        {/* Use appropriate rendering strategy based on content size and performance */}
        {useVirtualization ? (
          <VirtualizedDocument
            content={content}
            className="prose max-w-none p-6"
            readOnly={false}
            onContentChange={(newContent) => {
              setContent(newContent)
              setHasChanges(true)
            }}
            onRenderComplete={() => setIsRenderingMarkdown(false)}
          />
        ) : useProgressiveRendering ? (
          <ProgressiveRendering
            content={content}
            className="prose max-w-none p-6"
            initialChunkSize={5000}
            incrementSize={10000}
            renderPlaceholder={(remainingChunks) => (
              <div className="text-center p-4 text-gray-500">
                Loading more content... ({remainingChunks})
              </div>
            )}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onClick={() => {
              // Click auto-scroll only on mobile
              if (isMobileDevice()) {
                setTimeout(() => {
                  scrollCursorIntoView()
                }, 10)
              }
              // Desktop: no auto-scroll on click - users prefer manual control
            }}
            onPaste={() => {
              // Handle paste events with auto-scroll only on mobile
              setTimeout(() => {
                updateContentFromEditor()
                if (isMobileDevice()) {
                  scrollCursorIntoView()
                }
              }, 50)
            }}
            onFocus={() => {
              // Focus auto-scroll only on mobile
              if (isMobileDevice()) {
                setTimeout(() => {
                  scrollCursorIntoView()
                }, 50)
              }
              // Desktop: no auto-scroll on focus - users prefer manual control
            }}
            className="prose max-w-none p-6 focus:outline-none min-h-96"
          />
        )}

        {/* Status Bar */}
        <div className={`editor-status-bar ${isStatusBarFloating ? 'floating' : ''} ${showStatusBar ? '' : 'hidden'}`}>
          <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              {hasChanges && !isSaving && <span className="text-orange-600">• Unsaved changes</span>}
              <span className="text-xs opacity-60">Ctrl+S to save</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile List Hint */}
      {showMobileListHint && isMobileDevice() && (
        <div className="mobile-list-hint show">
          Press Enter again to exit list
        </div>
      )}

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
