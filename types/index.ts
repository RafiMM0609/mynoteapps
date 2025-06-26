/**
 * Core Data Types & Interfaces
 * Centralized type definitions for better maintainability
 */

// =============================================================================
// USER TYPES
// =============================================================================

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  token?: string
  isAuthenticated: boolean
}

// =============================================================================
// NOTE TYPES
// =============================================================================

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

export interface NoteWithHierarchy extends Note {
  level: number
  path: string[]
  children?: NoteWithHierarchy[]
}

export interface NoteMetadata {
  wordCount: number
  lastModified: string
  tags: string[]
  readingTime: number
}

// =============================================================================
// NOTE LINKING TYPES
// =============================================================================

export interface NoteLink {
  id: string
  source_note_id: string
  target_note_id: string
  link_type: 'reference' | 'embed' | 'child'
  created_at: string
}

export interface NoteLinkContext {
  sourceNote: Note
  targetNote: Note
  context: string
  lineNumber: number
}

// =============================================================================
// TAG TYPES
// =============================================================================

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

// =============================================================================
// UI COMPONENT TYPES
// =============================================================================

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ModalState {
  isOpen: boolean
  title?: string
  content?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
}

// =============================================================================
// EDITOR TYPES
// =============================================================================

export interface EditorState {
  content: string
  cursorPosition: number
  hasChanges: boolean
  isSaving: boolean
  lastSaved?: string
}

export interface SlashCommand {
  id: string
  label: string
  description: string
  icon: React.ComponentType<any>
  shortcut?: string
  category?: 'text' | 'block' | 'media' | 'embed'
  action: () => { before: string; after: string }
}

export interface NoteLinkDetection {
  isInNoteLink: boolean
  searchQuery: string
  startPosition: number
  endPosition: number
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export interface SearchResult {
  note: Note
  highlights: string[]
  relevanceScore: number
  matchType: 'title' | 'content' | 'tag'
}

export interface SearchFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
  folders?: string[]
  sortBy?: 'relevance' | 'date' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// =============================================================================
// HOOK TYPES
// =============================================================================

export interface UseToastReturn {
  toasts: ToastMessage[]
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
  hideToast: (id: string) => void
  clearToasts: () => void
}

export interface UseScrollDetectionOptions {
  threshold?: number
  root?: Element | null
  rootMargin?: string
}

export interface UseScrollDetectionReturn {
  isScrolledPastThreshold: boolean
  containerRef: React.RefObject<HTMLElement>
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type WithTimestamps<T> = T & {
  created_at: string
  updated_at: string
}

export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>

export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface AppConfig {
  maxNoteSize: number
  autosaveInterval: number
  searchDebounceTime: number
  maxSearchResults: number
  supportedFileTypes: string[]
}

export interface FeatureFlags {
  enableAI: boolean
  enableRealTimeSync: boolean
  enableAdvancedSearch: boolean
  enableNoteLinking: boolean
  enableMarkdownSupport: boolean
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export interface NoteEvent {
  type: 'created' | 'updated' | 'deleted' | 'moved'
  noteId: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface UserAction {
  type: 'view' | 'edit' | 'delete' | 'share' | 'export'
  resourceId: string
  timestamp: string
  userId: string
}
