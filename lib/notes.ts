import { supabase } from './supabase'
import type { Note, NoteLink, NoteTag, NoteTagRelation, NoteWithHierarchy, NoteWithLinks } from './supabase'

export interface CreateNoteData {
  title: string
  content?: string
  parent_id?: string | null
  is_folder?: boolean
  sort_order?: number
}

export interface UpdateNoteData {
  title?: string
  content?: string
}

// Get all notes for a user
export async function getUserNotes(userId: string): Promise<Note[]> {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return []
    }

    return notes || []
  } catch (error) {
    console.error('Error fetching notes:', error)
    return []
  }
}

// Get a single note by ID
export async function getNote(noteId: string, userId: string): Promise<Note | null> {
  try {
    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching note:', error)
      return null
    }

    return note
  } catch (error) {
    console.error('Error fetching note:', error)
    return null
  }
}

// Create a new note
export async function createNote(userId: string, noteData: CreateNoteData): Promise<Note | null> {
  try {
    const { data: note, error } = await supabase
      .from('notes')
      .insert([{
        user_id: userId,
        title: noteData.title,
        content: noteData.content || ''
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating note:', error)
      return null
    }

    return note
  } catch (error) {
    console.error('Error creating note:', error)
    return null
  }
}

// Update an existing note
export async function updateNote(noteId: string, userId: string, updates: UpdateNoteData): Promise<Note | null> {
  try {
    const { data: note, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating note:', error)
      return null
    }

    return note
  } catch (error) {
    console.error('Error updating note:', error)
    return null
  }
}

// Delete a note
export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting note:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting note:', error)
    return false
  }
}

// Search notes by title or content
export async function searchNotes(userId: string, query: string): Promise<Note[]> {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error searching notes:', error)
      return []
    }

    return notes || []
  } catch (error) {
    console.error('Error searching notes:', error)
    return []
  }
}

// ========== NEW FUNCTIONS FOR HIERARCHY ==========

// Get notes with hierarchy structure
export async function getNotesHierarchy(userId: string, parentId: string | null = null): Promise<NoteWithHierarchy[]> {
  try {
    const { data, error } = await supabase.rpc('get_note_hierarchy', {
      user_id_param: userId,
      parent_id_param: parentId
    })

    if (error) {
      console.error('Error fetching notes hierarchy:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching notes hierarchy:', error)
    return []
  }
}

// Create a folder
export async function createFolder(userId: string, title: string, parentId?: string): Promise<Note | null> {
  return createNote(userId, {
    title,
    content: '',
    parent_id: parentId || null,
    is_folder: true,
    sort_order: 0
  })
}

// Move note to different parent
export async function moveNote(noteId: string, userId: string, newParentId: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notes')
      .update({ parent_id: newParentId })
      .eq('id', noteId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error moving note:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error moving note:', error)
    return false
  }
}

// Reorder notes
export async function reorderNotes(userId: string, noteUpdates: { id: string; sort_order: number }[]): Promise<boolean> {
  try {
    const updates = noteUpdates.map(update => 
      supabase
        .from('notes')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('user_id', userId)
    )

    const results = await Promise.all(updates)
    
    for (const result of results) {
      if (result.error) {
        console.error('Error reordering notes:', result.error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error reordering notes:', error)
    return false
  }
}

// ========== NEW FUNCTIONS FOR LINKING ==========

// Create a link between notes
export async function createNoteLink(sourceNoteId: string, targetNoteId: string, linkType: 'reference' | 'embed' | 'child' = 'reference'): Promise<NoteLink | null> {
  try {
    const { data, error } = await supabase
      .from('note_links')
      .insert([{
        source_note_id: sourceNoteId,
        target_note_id: targetNoteId,
        link_type: linkType
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating note link:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating note link:', error)
    return null
  }
}

// Get note with all its links
export async function getNoteWithLinks(noteId: string, userId: string): Promise<NoteWithLinks | null> {
  try {
    // Get the note
    const note = await getNote(noteId, userId)
    if (!note) return null

    // Get outgoing links
    const { data: linksFrom, error: linksFromError } = await supabase
      .from('note_links')
      .select(`
        *,
        target_note:notes!target_note_id(id, title, is_folder)
      `)
      .eq('source_note_id', noteId)

    if (linksFromError) {
      console.error('Error fetching outgoing links:', linksFromError)
    }

    // Get incoming links
    const { data: linksTo, error: linksToError } = await supabase
      .from('note_links')
      .select(`
        *,
        source_note:notes!source_note_id(id, title, is_folder)
      `)
      .eq('target_note_id', noteId)

    if (linksToError) {
      console.error('Error fetching incoming links:', linksToError)
    }

    // Get tags
    const { data: tagRelations, error: tagsError } = await supabase
      .from('note_tag_relations')
      .select(`
        *,
        tag:note_tags(*)
      `)
      .eq('note_id', noteId)

    if (tagsError) {
      console.error('Error fetching note tags:', tagsError)
    }

    const tags = tagRelations?.map(rel => rel.tag).filter(Boolean) || []

    return {
      ...note,
      links_from: linksFrom || [],
      links_to: linksTo || [],
      tags: tags as NoteTag[]
    }
  } catch (error) {
    console.error('Error fetching note with links:', error)
    return null
  }
}

// Remove link between notes
export async function removeNoteLink(linkId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('note_links')
      .delete()
      .eq('id', linkId)

    if (error) {
      console.error('Error removing note link:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error removing note link:', error)
    return false
  }
}

// ========== NEW FUNCTIONS FOR TAGGING ==========

// Create a new tag
export async function createTag(userId: string, name: string, color: string = '#3B82F6'): Promise<NoteTag | null> {
  try {
    const { data, error } = await supabase
      .from('note_tags')
      .insert([{
        user_id: userId,
        name,
        color
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating tag:', error)
    return null
  }
}

// Get all tags for a user
export async function getUserTags(userId: string): Promise<NoteTag[]> {
  try {
    const { data, error } = await supabase
      .from('note_tags')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) {
      console.error('Error fetching tags:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

// Add tag to note
export async function addTagToNote(noteId: string, tagId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('note_tag_relations')
      .insert([{
        note_id: noteId,
        tag_id: tagId
      }])

    if (error) {
      console.error('Error adding tag to note:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error adding tag to note:', error)
    return false
  }
}

// Remove tag from note
export async function removeTagFromNote(noteId: string, tagId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('note_tag_relations')
      .delete()
      .eq('note_id', noteId)
      .eq('tag_id', tagId)

    if (error) {
      console.error('Error removing tag from note:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error removing tag from note:', error)
    return false
  }
}

// Search notes by tag
export async function searchNotesByTag(userId: string, tagId: string): Promise<Note[]> {
  try {
    const { data, error } = await supabase
      .from('note_tag_relations')
      .select(`
        note:notes(*)
      `)
      .eq('tag_id', tagId)

    if (error) {
      console.error('Error searching notes by tag:', error)
      return []
    }

    // Filter notes by user_id since we can't do it in the query above
    const notes = data?.map((item: any) => item.note as Note).filter((note: Note) => note && note.user_id === userId) || []
    return notes
  } catch (error) {
    console.error('Error searching notes by tag:', error)
    return []
  }
}
