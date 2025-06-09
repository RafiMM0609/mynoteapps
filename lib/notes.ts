import { supabase } from './supabase'

export interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export async function getAllNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching notes:', error)
    throw new Error('Failed to fetch notes')
  }

  return data || []
}

export async function getNoteById(id: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching note:', error)
    return null
  }

  return data
}

export async function createNote(title: string, content: string): Promise<Note> {
  const newNote = {
    title: title.trim(),
    content: content || '',
  }

  const { data, error } = await supabase
    .from('notes')
    .insert([newNote])
    .select()
    .single()

  if (error) {
    console.error('Error creating note:', error)
    throw new Error('Failed to create note')
  }

  return data
}

export async function updateNote(id: string, title: string, content: string): Promise<Note | null> {
  const updatedNote = {
    title: title.trim(),
    content: content || '',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updatedNote)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating note:', error)
    return null
  }

  return data
}

export async function deleteNote(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting note:', error)
    return false
  }

  return true
}
