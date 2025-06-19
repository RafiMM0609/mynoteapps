import { supabase } from './supabase'
import type { Note } from './supabase'

export interface CreateNoteData {
  title: string
  content?: string
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
