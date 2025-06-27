'use client'

import { useMemo, useEffect, useRef } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Note } from '../lib/supabase'
import { useNoteLinkParser } from '../hooks/useNoteLinkParser'
import { NoteLink } from './NoteLinkRenderer'
import { CodeBlock } from './EnhancedCodeBlock'

// Initialize DOMPurify for client-side use
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: return as-is (or use a server-safe sanitizer)
    return html
  }
  return DOMPurify.sanitize(html)
}

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
  const containerRef = useRef<HTMLDivElement>(null)

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
    })    // Convert markdown to HTML with enhanced code block support
    try {
      const rawHtml = marked(processedContent, { 
        breaks: true, 
        gfm: true
      }) as string
      return sanitizeHtml(rawHtml)
    } catch (error) {
      console.error('Error rendering markdown:', error)
      return content
    }
  }, [parsedContent, content])

  // Enhanced post-processing for both note links and code blocks
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Handle code blocks
    const codeBlocks = container.querySelectorAll('pre code')
    codeBlocks.forEach((codeElement) => {
      const preElement = codeElement.parentElement
      if (!preElement) return

      // Skip if this code block already has a copy button (from EnhancedCodeBlock component)
      const parentContainer = preElement.closest('.code-block-container')
      if (parentContainer && parentContainer.querySelector('.copy-button')) {
        return // Skip processing this pre element
      }

      const className = codeElement.className
      const languageMatch = className.match(/language-(\w+)/)
      const language = languageMatch ? languageMatch[1] : 'text'
      const code = codeElement.textContent || ''

      // Create enhanced code block
      const codeBlockContainer = document.createElement('div')
      codeBlockContainer.className = 'code-block-container'
      
      const enhancedPre = document.createElement('pre')
      enhancedPre.className = `language-${language}`
      enhancedPre.setAttribute('data-language', language)
      
      const enhancedCode = document.createElement('code')
      enhancedCode.className = `language-${language}`
      enhancedCode.textContent = code
      
      enhancedPre.appendChild(enhancedCode)
      
      // Add copy button
      const copyButton = document.createElement('button')
      copyButton.className = 'copy-button'
      copyButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
        </svg>
        <span>Copy</span>
      `
      
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code)
          copyButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Copied!</span>
          `
          copyButton.classList.add('copied')
          
          setTimeout(() => {
            copyButton.innerHTML = `
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
              <span>Copy</span>
            `
            copyButton.classList.remove('copied')
          }, 2000)
        } catch (err) {
          console.error('Failed to copy text: ', err)
        }
      })
      
      codeBlockContainer.appendChild(enhancedPre)
      codeBlockContainer.appendChild(copyButton)
      
      preElement.parentNode?.replaceChild(codeBlockContainer, preElement)
    })

    // Handle note links (existing logic)
    const noteLinkElements = container.querySelectorAll('[data-note-link]')
    noteLinkElements.forEach((element) => {
      const noteTitle = element.getAttribute('data-note-link')
      const noteExists = element.getAttribute('data-note-exists') === 'true'
      
      if (noteTitle) {
        const note = availableNotes.find(n => n.title?.toLowerCase() === noteTitle.toLowerCase())
        
        element.className = noteExists 
          ? 'inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 transition-colors duration-150 cursor-pointer'
          : 'inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-700'
        
        element.setAttribute('data-note-id', note?.id || '')
        element.setAttribute('data-note-title', noteTitle)
        element.innerHTML = `
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${noteExists 
              ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>'
              : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>'
            }
          </svg>
          ${noteTitle}
        `
      }
    })
  }, [renderedContent, availableNotes])
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
      ref={containerRef}
      className={`prose prose-sm max-w-none dark:prose-invert markdown-content ${className}`}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ 
        __html: renderedContent
      }}
    />
  )
}
