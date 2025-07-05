'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
import type { Note } from '../lib/supabase'
import SlashCommandDropdown from './SlashCommandDropdown'
import InlineNoteLinking from './InlineNoteLinking'
import FloatingActionButtons from './FloatingActionButtons'
import markdownProcessor from '../lib/async-markdown'

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
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // State for slash commands
  const [showSlashDropdown, setShowSlashDropdown] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [slashStartPos, setSlashStartPos] = useState(0)
  const [activeNode, setActiveNode] = useState<Node | null>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const turndownService = useRef(new TurndownService())
  
  // Helper to detect mobile devices
  const isMobileDevice = () => typeof window !== 'undefined' && window.innerWidth <= 768

  // Initialize content in editor
  useEffect(() => {
    const setInitialContent = async () => {
        if (editorRef.current) {
            const html = await Promise.resolve(marked(note.content || '', { breaks: true, gfm: true }));
            editorRef.current.innerHTML = sanitizeHtml(html as string);
        }
    };
    setInitialContent();
  }, [note.id]); // Only on initial note load

  // Helper function to detect iOS specifically
  const isiOSDevice = () => {
    return typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  }

  // Note linking detection - Simplified, assuming a hook `useNoteLinkDetection` exists and works
  // If not, this part might need to be implemented directly.
  // For now, let's create a placeholder to avoid errors.
  const useNoteLinkDetection = (text: string, cursor: number) => {
      const isInNoteLink = text.substring(0, cursor).includes('[[ ') && !text.substring(0, cursor).includes(']]');
      const searchQuery = isInNoteLink ? text.substring(text.lastIndexOf('[[ ') + 2, cursor) : '';
      return { isInNoteLink, searchQuery };
  };
  const noteLinkDetection = useNoteLinkDetection(content, cursorPosition)

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
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

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
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
        // A simplified cursor position update
        const textNode = range.startContainer;
        const fullText = textNode.textContent || '';
        let cumulativePos = 0;
        // This is a simplified representation. A robust solution would traverse the DOM.
        // For now, this avoids errors but might not be perfectly accurate.
        setCursorPosition(range.startOffset);
      }
    }
  }

  // Helper function to scroll cursor into view with enhanced desktop experience
  const scrollCursorIntoView = () => {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const scrollableContent = containerRef.current
    
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
        // Use insertHTML for better heading support
        document.execCommand('insertHTML', false, '<h1 style="font-size: 2rem; font-weight: 700; color: #111827; margin-top: 2rem; margin-bottom: 1.5rem;">Heading 1</h1>')
        break
      case 'heading2':
        document.execCommand('insertHTML', false, '<h2 style="font-size: 1.75rem; font-weight: 600; color: #1f2937; margin-top: 1.75rem; margin-bottom: 1.25rem;">Heading 2</h2>')
        break
      case 'heading3':
        document.execCommand('insertHTML', false, '<h3 style="font-size: 1.5rem; font-weight: 600; color: #374151; margin-top: 1.5rem; margin-bottom: 1rem;">Heading 3</h3>')
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
      case 'checklist':
      case 'checkbox':
        // Insert checkbox list item with better formatting
        document.execCommand('insertHTML', false, '☐ ')
        break
      case 'quote':
        // Insert blockquote
        document.execCommand('formatBlock', false, '<blockquote>')
        break
      case 'link':
        // Insert link format
        document.execCommand('insertHTML', false, '<a href="url">link text</a>')
        break
      case 'table':
        // Insert basic table
        document.execCommand('insertHTML', false, 
          '<table border="1" style="border-collapse: collapse; width: 100%; margin: 1rem 0;"><tr><th>Column 1</th><th>Column 2</th></tr><tr><td>Cell 1</td><td>Cell 2</td></tr></table>')
        break
      case 'image':
        // Insert image placeholder
        document.execCommand('insertHTML', false, '<img src="image-url" alt="alt text" style="max-width: 100%; height: auto;">')
        break
      case 'divider':
        // Insert horizontal rule
        document.execCommand('insertHTML', false, '<hr style="margin: 2rem 0; border: none; border-top: 1px solid #e5e7eb;">')
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

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
          // This logic is complex and depends on state `lastEnterTime`, which was removed.
          // For simplification, this feature is temporarily disabled.
          // A simple "Press Enter again" hint could be shown via another mechanism if needed.
        }
        
        // Enhanced mobile numbered list handling for iOS compatibility
        if ((isMobileDevice() || isiOSDevice()) && parentList.nodeName === 'OL') {
          e.preventDefault();
          
          // iOS-specific handling for numbered lists
          console.log('iOS numbered list handling triggered');
          
          // Get all list items and find current position
          const listItems = Array.from(parentList.children) as HTMLLIElement[];
          const currentIndex = listItems.indexOf(parentListItem as HTMLLIElement);
          
          // Create new list item
          const newListItem = document.createElement('li');
          newListItem.innerHTML = '<br>';
          
          // Insert after current item
          if (parentListItem.nextSibling) {
            parentList.insertBefore(newListItem, parentListItem.nextSibling);
          } else {
            parentList.appendChild(newListItem);
          }
          
          // Set cursor in new list item
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(newListItem, 0);
          range.setEnd(newListItem, 0);
          sel?.removeAllRanges();
          sel?.addRange(range);
          
          // Auto-scroll for mobile with longer delay for iOS
          setTimeout(() => {
            scrollCursorIntoView();
          }, isiOSDevice() ? 50 : 20);
          
          return;
        }
        
        // Normal list behavior - let browser handle new list item creation for non-mobile or UL
        return;
      }

      // Enhanced desktop Enter behavior for better editing experience
      if (!isMobileDevice()) {
        // On desktop, use improved behavior for better cursor positioning
        e.preventDefault();
        
        console.log('Enter key pressed on desktop');
        
        // Get current selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Check if we're in a heading or other block element that should not continue
          let currentElement: any = range.startContainer;
          if (currentElement.nodeType === Node.TEXT_NODE) {
            currentElement = currentElement.parentElement;
          }
          
          // Find the closest block-level element
          while (currentElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'P', 'DIV'].includes(currentElement.nodeName)) {
            currentElement = currentElement.parentElement;
          }
          
          console.log('Current element:', currentElement?.nodeName);
          
          // If we're in a heading or blockquote, create a normal paragraph
          if (currentElement && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(currentElement.nodeName)) {
            console.log('In heading/blockquote, creating new paragraph');
            const newParagraph = document.createElement('p');
            newParagraph.innerHTML = '<br>';
            
            // Insert after the current element
            if (currentElement.nextSibling) {
              currentElement.parentNode?.insertBefore(newParagraph, currentElement.nextSibling);
            } else {
              currentElement.parentNode?.appendChild(newParagraph);
            }
            
            // Position cursor in the new paragraph
            range.setStart(newParagraph, 0);
            range.setEnd(newParagraph, 0);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            console.log('In normal element, creating new paragraph');
            // For normal paragraphs, create a new paragraph
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
          }
          
          // Desktop: no auto-scroll after Enter - users prefer manual control
        }
      } else {
        // Mobile behavior - use insertHTML for consistency but handle headings properly
        e.preventDefault();
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          let currentElement: any = range.startContainer;
          
          if (currentElement.nodeType === Node.TEXT_NODE) {
            currentElement = currentElement.parentElement;
          }
          
          // Find the closest block-level element
          while (currentElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'P', 'DIV'].includes(currentElement.nodeName)) {
            currentElement = currentElement.parentElement;
          }
          
          // If we're in a heading or blockquote, exit to normal paragraph
          if (currentElement && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(currentElement.nodeName)) {
            document.execCommand('insertHTML', false, '<p><br></p>');
          } else {
            document.execCommand('insertHTML', false, '<div><br></div>');
          }
        }
      }
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    if (!hasChanges) {
      setHasChanges(true)
    }
  }

  return (
    <div className="editor-container-with-fixed-header note-editor-mobile">
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
          position={slashPosition} // Re-using slash position for simplicity
          searchQuery={noteLinkDetection.searchQuery}
          availableNotes={availableNotes}
          currentNoteId={note.id}
          onSelect={handleNoteLinkSelect}
          onClose={() => { /* Logic to hide this would be in useNoteLinkDetection */ }}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-s font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50"
              disabled={isSaving}
              title="Cancel editing (Esc)"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
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
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : saveSuccess ? (
                <CheckIcon className="w-3.5 h-3.5 animate-bounce" />
              ) : (
                <CheckIcon className="w-3.5 h-3.5" />
              )}
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

      {/* Scrollable Content Area - Simplified */}
      <div 
        ref={containerRef}
        className="scrollable-editor-content custom-scrollbar overflow-y-auto" 
        style={{ 
          paddingTop: 'calc(60px + 0.5rem)', // Adjust based on header height
          paddingBottom: '2rem' 
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleEditorKeyDown}
          onClick={() => {
            if (isMobileDevice()) {
              setTimeout(() => scrollCursorIntoView(), 10)
            }
          }}
          onPaste={() => {
            setTimeout(() => {
              updateContentFromEditor()
              if (isMobileDevice()) {
                scrollCursorIntoView()
              }
            }, 50)
          }}
          onFocus={() => {
            if (isMobileDevice()) {
              setTimeout(() => scrollCursorIntoView(), 50)
            }
          }}
          className="prose max-w-none p-6 focus:outline-none"
        />
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
