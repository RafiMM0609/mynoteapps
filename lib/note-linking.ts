import type { Note } from './supabase'

/**
 * Extract all note links from content
 */
export function extractNoteLinks(content: string): string[] {
  const noteLinkRegex = /\[\[([^\]]+)\]\]/g
  const matches: string[] = []
  let match

  while ((match = noteLinkRegex.exec(content)) !== null) {
    const noteTitle = match[1].trim()
    if (noteTitle && !matches.includes(noteTitle)) {
      matches.push(noteTitle)
    }
  }

  return matches
}

/**
 * Replace note title references in content when a note is renamed
 */
export function updateNoteLinkReferences(content: string, oldTitle: string, newTitle: string): string {
  if (!oldTitle || !newTitle || oldTitle === newTitle) {
    return content
  }

  // Create regex to match the exact note title (case insensitive)
  const escapedOldTitle = oldTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`\\[\\[${escapedOldTitle}\\]\\]`, 'gi')
  
  return content.replace(regex, `[[${newTitle}]]`)
}

/**
 * Find all notes that reference a specific note title
 */
export function findNotesReferencingTitle(notes: Note[], targetTitle: string): Note[] {
  if (!targetTitle) return []

  return notes.filter(note => {
    if (!note.content) return false
    
    const referencedTitles = extractNoteLinks(note.content)
    return referencedTitles.some(title => 
      title.toLowerCase() === targetTitle.toLowerCase()
    )
  })
}

/**
 * Get all unique note titles referenced in a note's content
 */
export function getReferencedNoteTitles(content: string, availableNotes: Note[]): Note[] {
  const referencedTitles = extractNoteLinks(content)
  const noteMap = new Map<string, Note>()
  
  availableNotes.forEach(note => {
    if (note.title) {
      noteMap.set(note.title.toLowerCase(), note)
    }
  })

  const referencedNotes: Note[] = []
  referencedTitles.forEach(title => {
    const note = noteMap.get(title.toLowerCase())
    if (note) {
      referencedNotes.push(note)
    }
  })

  return referencedNotes
}

/**
 * Check if content contains any note links
 */
export function hasNoteLinks(content: string): boolean {
  return /\[\[([^\]]+)\]\]/.test(content)
}

/**
 * Get position information for note links in content
 */
export function getNoteLinkPositions(content: string): Array<{
  title: string
  startIndex: number
  endIndex: number
  fullMatch: string
}> {
  const positions: Array<{
    title: string
    startIndex: number
    endIndex: number
    fullMatch: string
  }> = []
  
  const noteLinkRegex = /\[\[([^\]]+)\]\]/g
  let match

  while ((match = noteLinkRegex.exec(content)) !== null) {
    positions.push({
      title: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      fullMatch: match[0]
    })
  }

  return positions
}

/**
 * Insert a note link at a specific position in content
 */
export function insertNoteLinkAtPosition(
  content: string, 
  position: number, 
  noteTitle: string
): string {
  const before = content.slice(0, position)
  const after = content.slice(position)
  const noteLink = `[[${noteTitle}]]`
  
  return before + noteLink + after
}

/**
 * Replace a text selection with a note link
 */
export function replaceSelectionWithNoteLink(
  content: string,
  startPos: number,
  endPos: number,
  noteTitle: string
): string {
  const before = content.slice(0, startPos)
  const after = content.slice(endPos)
  const noteLink = `[[${noteTitle}]]`
  
  return before + noteLink + after
}

/**
 * Validate note title for use in note links
 */
export function validateNoteTitleForLinking(title: string): {
  isValid: boolean
  error?: string
} {
  if (!title.trim()) {
    return { isValid: false, error: 'Title cannot be empty' }
  }

  if (title.includes('[[') || title.includes(']]')) {
    return { isValid: false, error: 'Title cannot contain [[ or ]]' }
  }

  if (title.includes('\n')) {
    return { isValid: false, error: 'Title cannot contain line breaks' }
  }

  if (title.length > 100) {
    return { isValid: false, error: 'Title is too long (max 100 characters)' }
  }

  return { isValid: true }
}

/**
 * Generate backlinks data structure
 */
export function generateBacklinks(notes: Note[]): Map<string, Note[]> {
  const backlinks = new Map<string, Note[]>()

  notes.forEach(note => {
    if (!note.content || !note.title) return

    const referencedTitles = extractNoteLinks(note.content)
    referencedTitles.forEach(referencedTitle => {
      if (!backlinks.has(referencedTitle.toLowerCase())) {
        backlinks.set(referencedTitle.toLowerCase(), [])
      }
      
      const existingBacklinks = backlinks.get(referencedTitle.toLowerCase())!
      if (!existingBacklinks.find(n => n.id === note.id)) {
        existingBacklinks.push(note)
      }
    })
  })

  return backlinks
}
