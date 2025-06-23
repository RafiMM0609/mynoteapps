import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  parent_id?: string | null
  is_folder: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface NoteLink {
  id: string
  source_note_id: string
  target_note_id: string
  link_type: 'reference' | 'embed' | 'child'
  created_at: string
}

export interface NoteTag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface NoteTagRelation {
  id: string
  note_id: string
  tag_id: string
  created_at: string
}

export interface NoteWithHierarchy extends Note {
  level: number
  path: string[]
  children?: NoteWithHierarchy[]
}

export interface NoteWithLinks extends Note {
  links_from: NoteLink[]
  links_to: NoteLink[]
  tags: NoteTag[]
}

export interface AuthToken {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
}
