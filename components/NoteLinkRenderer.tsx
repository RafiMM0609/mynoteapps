'use client'

import { useNoteLinkParser } from '../hooks/useNoteLinkParser'
import type { Note } from '../lib/supabase'
import { DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface NoteLinkRendererProps {
  content: string
  availableNotes: Note[]
  onNoteClick?: (note: Note) => void
  className?: string
}

interface NoteLinkProps {
  noteTitle: string
  note?: Note
  onNoteClick?: (note: Note) => void
}

function NoteLink({ noteTitle, note, onNoteClick }: NoteLinkProps) {
  const handleClick = () => {
    if (note && onNoteClick) {
      onNoteClick(note)
    }
  }

  if (note) {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700 transition-colors duration-150 cursor-pointer"
        title={`Open note: ${noteTitle}`}
      >
        <DocumentTextIcon className="w-3 h-3" />
        {noteTitle}
      </button>
    )
  }

  // Note doesn't exist - show as broken link
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-700"
      title={`Note not found: ${noteTitle}`}
    >
      <ExclamationTriangleIcon className="w-3 h-3" />
      {noteTitle}
    </span>
  )
}

export default function NoteLinkRenderer({ 
  content, 
  availableNotes, 
  onNoteClick,
  className = ""
}: NoteLinkRendererProps) {
  const parsedContent = useNoteLinkParser(content, availableNotes)

  return (
    <div className={className}>
      {parsedContent.map((segment, index) => {
        if (segment.type === 'notelink') {
          return (
            <NoteLink
              key={`${segment.startIndex}-${segment.endIndex}`}
              noteTitle={segment.noteTitle}
              note={segment.note}
              onNoteClick={onNoteClick}
            />
          )
        }

        // For text segments, preserve line breaks and other formatting
        return (
          <span key={`${segment.startIndex}-${segment.endIndex}`}>
            {segment.content.split('\n').map((line, lineIndex, lines) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </span>
        )
      })}
    </div>
  )
}

// Export individual components for more granular usage
export { NoteLink }
