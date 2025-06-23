import { useMemo } from 'react'
import type { Note } from '../lib/supabase'

interface NoteLinkMatch {
  type: 'notelink'
  content: string
  noteTitle: string
  startIndex: number
  endIndex: number
  note?: Note
}

interface TextMatch {
  type: 'text'
  content: string
  startIndex: number
  endIndex: number
}

type ContentMatch = NoteLinkMatch | TextMatch

export function useNoteLinkParser(content: string, availableNotes: Note[]) {
  const parsedContent = useMemo(() => {
    if (!content) return []

    const matches: ContentMatch[] = []
    const noteLinkRegex = /\[\[([^\]]+)\]\]/g
    let lastIndex = 0
    let match

    // Create a map for quick note lookup
    const noteMap = new Map<string, Note>()
    availableNotes.forEach(note => {
      if (note.title) {
        noteMap.set(note.title.toLowerCase(), note)
      }
    })

    while ((match = noteLinkRegex.exec(content)) !== null) {
      const [fullMatch, noteTitle] = match
      const startIndex = match.index
      const endIndex = startIndex + fullMatch.length

      // Add text before the note link
      if (startIndex > lastIndex) {
        matches.push({
          type: 'text',
          content: content.slice(lastIndex, startIndex),
          startIndex: lastIndex,
          endIndex: startIndex
        })
      }

      // Add the note link
      const linkedNote = noteMap.get(noteTitle.toLowerCase())
      matches.push({
        type: 'notelink',
        content: fullMatch,
        noteTitle: noteTitle,
        startIndex,
        endIndex,
        note: linkedNote
      })

      lastIndex = endIndex
    }

    // Add remaining text after the last note link
    if (lastIndex < content.length) {
      matches.push({
        type: 'text',
        content: content.slice(lastIndex),
        startIndex: lastIndex,
        endIndex: content.length
      })
    }

    // If no note links found, return the entire content as text
    if (matches.length === 0) {
      matches.push({
        type: 'text',
        content,
        startIndex: 0,
        endIndex: content.length
      })
    }

    return matches
  }, [content, availableNotes])

  return parsedContent
}

// Hook to detect note link patterns while typing
export function useNoteLinkDetection(content: string, cursorPosition: number) {
  const detection = useMemo(() => {
    if (!content || cursorPosition < 0) return null

    // Look for incomplete note links around cursor position
    const beforeCursor = content.slice(0, cursorPosition)
    const afterCursor = content.slice(cursorPosition)

    // Check if we're inside a note link pattern
    const openBrackets = beforeCursor.lastIndexOf('[[')
    const closeBrackets = beforeCursor.lastIndexOf(']]')

    // If we found [[ after the last ]] (or no ]] at all), we might be in a note link
    if (openBrackets > closeBrackets) {
      // Check if there's a closing ]] in the after cursor part
      const nextCloseBrackets = afterCursor.indexOf(']]')
      
      // If no closing brackets found, we're typing a note link
      if (nextCloseBrackets === -1 || nextCloseBrackets > 0) {
        const searchQuery = beforeCursor.slice(openBrackets + 2)
        
        // Make sure we don't have any line breaks in the search query
        if (!searchQuery.includes('\n')) {
          return {
            isInNoteLink: true,
            searchQuery,
            startPosition: openBrackets,
            endPosition: cursorPosition
          }
        }
      }
    }

    return null
  }, [content, cursorPosition])

  return detection
}
