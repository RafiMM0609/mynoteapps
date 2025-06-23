'use client'

import { useMemo } from 'react'
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'
import { generateBacklinks, extractNoteLinks } from '../lib/note-linking'

interface BacklinksProps {
  currentNote: Note
  allNotes: Note[]
  onNoteClick?: (note: Note) => void
  className?: string
}

interface BacklinkItemProps {
  note: Note
  currentNoteTitle: string
  onNoteClick?: (note: Note) => void
}

function BacklinkItem({ note, currentNoteTitle, onNoteClick }: BacklinkItemProps) {
  // Extract context around the note link
  const linkContext = useMemo(() => {
    if (!note.content || !currentNoteTitle) return ''

    const content = note.content
    const linkPattern = `[[${currentNoteTitle}]]`
    const linkIndex = content.toLowerCase().indexOf(`[[${currentNoteTitle.toLowerCase()}]]`)
    
    if (linkIndex === -1) return ''

    // Get context around the link (50 chars before and after)
    const contextStart = Math.max(0, linkIndex - 50)
    const contextEnd = Math.min(content.length, linkIndex + linkPattern.length + 50)
    
    let context = content.slice(contextStart, contextEnd)
    
    // Add ellipsis if we truncated
    if (contextStart > 0) context = '...' + context
    if (contextEnd < content.length) context = context + '...'

    // Highlight the note link
    const regex = new RegExp(`\\[\\[${currentNoteTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'gi')
    context = context.replace(regex, `**[[${currentNoteTitle}]]**`)

    return context
  }, [note.content, currentNoteTitle])

  const handleClick = () => {
    if (onNoteClick) {
      onNoteClick(note)
    }
  }

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <DocumentTextIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {note.title || 'Untitled'}
          </h4>
        </div>
        
        {onNoteClick && (
          <button
            onClick={handleClick}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-150"
            title="Open note"
          >
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {linkContext && (
        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <div className="font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded border">
            {linkContext.split('**').map((part, index) => {
              if (part.startsWith('[[') && part.endsWith(']]')) {
                return (
                  <span key={index} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1 rounded">
                    {part}
                  </span>
                )
              }
              return <span key={index}>{part}</span>
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {note.updated_at 
            ? new Date(note.updated_at).toLocaleDateString() 
            : 'Unknown date'
          }
        </span>
      </div>
    </div>
  )
}

export default function Backlinks({ 
  currentNote, 
  allNotes, 
  onNoteClick,
  className = ""
}: BacklinksProps) {
  const backlinks = useMemo(() => {
    if (!currentNote.title) return []

    const backlinksMap = generateBacklinks(allNotes)
    return backlinksMap.get(currentNote.title.toLowerCase()) || []
  }, [currentNote.title, allNotes])

  const outgoingLinks = useMemo(() => {
    if (!currentNote.content) return []

    const referencedTitles = extractNoteLinks(currentNote.content)
    const noteMap = new Map<string, Note>()
    
    allNotes.forEach(note => {
      if (note.title) {
        noteMap.set(note.title.toLowerCase(), note)
      }
    })

    return referencedTitles
      .map(title => noteMap.get(title.toLowerCase()))
      .filter(Boolean) as Note[]
  }, [currentNote.content, allNotes])

  if (backlinks.length === 0 && outgoingLinks.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No linked notes found</p>
          <p className="text-xs mt-1">Use [[Note Title]] to create links</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Outgoing Links */}
      {outgoingLinks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            Links from this note ({outgoingLinks.length})
          </h3>
          <div className="space-y-2">
            {outgoingLinks.map((note) => (
              <div
                key={note.id}
                className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md group cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-150"
                onClick={() => onNoteClick && onNoteClick(note)}
              >
                <DocumentTextIcon className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                    {note.title || 'Untitled'}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    {note.updated_at 
                      ? new Date(note.updated_at).toLocaleDateString() 
                      : 'Unknown date'
                    }
                  </div>
                </div>
                {onNoteClick && (
                  <ArrowTopRightOnSquareIcon className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Links (Backlinks) */}
      {backlinks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Notes linking here ({backlinks.length})
          </h3>
          <div className="space-y-3">
            {backlinks.map((note) => (
              <BacklinkItem
                key={note.id}
                note={note}
                currentNoteTitle={currentNote.title || ''}
                onNoteClick={onNoteClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
