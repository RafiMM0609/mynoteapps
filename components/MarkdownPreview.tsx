'use client'

import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Note } from '../lib/supabase'
import { useNoteLinkParser } from '../hooks/useNoteLinkParser'
import { NoteLink } from './NoteLinkRenderer'

interface MarkdownPreviewProps {
  content: string
  availableNotes: Note[]
  onNoteClick?: (note: Note) => void
  className?: string
}

export default function MarkdownPreview({ 
  content, 
  availableNotes, 
  onNoteClick,
  className = ""
}: MarkdownPreviewProps) {
  const parsedContent = useNoteLinkParser(content, availableNotes)

  const renderedContent = useMemo(() => {
    // Process the content to handle note links
    let processedContent = ''
    
    parsedContent.forEach((segment) => {
      if (segment.type === 'notelink') {
        // Replace note links with placeholder that we'll handle in post-processing
        processedContent += `<span data-note-link="${segment.noteTitle}" data-note-exists="${segment.note ? 'true' : 'false'}">${segment.noteTitle}</span>`
      } else {
        processedContent += segment.content
      }
    })    // Convert markdown to HTML
    try {
      const rawHtml = marked(processedContent, { 
        breaks: true, 
        gfm: true
      }) as string
      return DOMPurify.sanitize(rawHtml)
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return content
    }
  }, [parsedContent, content])

  // Custom renderer for note links
  const renderContentWithNoteLinks = (htmlContent: string) => {
    // Parse HTML and replace note link placeholders with actual components
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    const noteLinkElements = doc.querySelectorAll('[data-note-link]')
    
    noteLinkElements.forEach((element) => {
      const noteTitle = element.getAttribute('data-note-link')
      const noteExists = element.getAttribute('data-note-exists') === 'true'
      
      if (noteTitle) {
        const note = availableNotes.find(n => n.title?.toLowerCase() === noteTitle.toLowerCase())
        
        // Create a replacement element
        const replacement = doc.createElement('span')
        replacement.className = noteExists 
          ? 'inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 transition-colors duration-150 cursor-pointer'
          : 'inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-700'
        
        replacement.setAttribute('data-note-id', note?.id || '')
        replacement.setAttribute('data-note-title', noteTitle)
        replacement.innerHTML = `
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${noteExists 
              ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>'
              : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>'
            }
          </svg>
          ${noteTitle}
        `
        
        element.parentNode?.replaceChild(replacement, element)
      }
    })
    
    return doc.body.innerHTML
  }

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const noteLinkElement = target.closest('[data-note-id]')
    
    if (noteLinkElement && onNoteClick) {
      const noteId = noteLinkElement.getAttribute('data-note-id')
      const noteTitle = noteLinkElement.getAttribute('data-note-title')
      
      if (noteId) {
        const note = availableNotes.find(n => n.id === noteId)
        if (note) {
          onNoteClick(note)
        }
      }
    }
  }

  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ 
        __html: renderContentWithNoteLinks(renderedContent) 
      }}
    />
  )
}
