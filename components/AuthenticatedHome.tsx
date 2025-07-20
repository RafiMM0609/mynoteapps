'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  PlusIcon, 
  Bars3Icon, 
  XMarkIcon, 
  FolderIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  DocumentTextIcon,
  HeartIcon,
  StarIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import Header from './Header'
import NoteTree from './NoteTree'
import EnhancedNoteTree from './EnhancedNoteTree'
import EnhancedNoteList from './EnhancedNoteList'
import ViewToggle from './ViewToggle'
import NoteEditor from './NoteEditorWithMarkdownPreview'
import AdvancedBlockEditor from './AdvancedBlockEditor'
import NoteViewer from './NoteViewer'
import NoteLinking from './NoteLinking'
import NoteTags from './NoteTags'
import SearchableNoteList from './SearchableNoteList'
import SearchModal from './SearchModal'
import MobileNavigation from './MobileNavigation'
import type { AuthUser } from '../lib/auth'
import type { Note, NoteWithHierarchy, NoteTag, NoteLink } from '../lib/supabase'
import type { ToastMessage } from '../hooks/useToast'
import { 
  getNotesHierarchy, 
  createNote, 
  createFolder, 
  createNoteLink, 
  removeNoteLink,
  getUserTags,
  createTag,
  addTagToNote,
  removeTagFromNote,
  getNoteWithLinks
} from '../lib/notes'

interface AuthenticatedHomeProps {
  user: AuthUser
  onLogout: () => void
  showToast: (message: string, type: ToastMessage['type']) => void
}

export default function AuthenticatedHome({ user, onLogout, showToast }: AuthenticatedHomeProps) {  const [hierarchyNotes, setHierarchyNotes] = useState<NoteWithHierarchy[]>([])
  const [allNotes, setAllNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'tree' | 'search'>('tree') // New state for view mode
  const [showLinkedNotes, setShowLinkedNotes] = useState(false) // Show unlinked notes by default
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false) // Add search modal state
  const [showNoteLinking, setShowNoteLinking] = useState(false) // Add state for note linking toggle
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    note: Note | null
    isDeleting: boolean
  }>({
    isOpen: false,
    note: null,
    isDeleting: false
  })
  
  // New state for linking and tagging
  const [noteLinks, setNoteLinks] = useState<NoteLink[]>([])
  const [allTags, setAllTags] = useState<NoteTag[]>([])
  const [noteTags, setNoteTags] = useState<NoteTag[]>([])
  
  // Use ref to track if we're already loading note details
  const loadingNoteId = useRef<string | null>(null)

  // Load user data
  useEffect(() => {
    loadUserData()
  }, [])

  // Load note details when selected note ID changes
  useEffect(() => {
    console.log('useEffect triggered - selectedNote?.id:', selectedNote?.id, 'loadingNoteId.current:', loadingNoteId.current)
    if (selectedNote?.id && selectedNote.id !== loadingNoteId.current) {
      console.log('Loading note details for:', selectedNote.id)
      loadNoteDetails(selectedNote.id)
    } else if (selectedNote?.id) {
      console.log('Skipping loadNoteDetails - already loading this note')
    } else {
      console.log('No selectedNote or selectedNote.id is undefined')
    }
  }, [selectedNote?.id]) // Only depend on the ID, not the entire object

  const loadUserData = async () => {
    try {
      const [notesData, tagsData] = await Promise.all([
        getNotesHierarchy(user.id),
        getUserTags(user.id)
      ])
      
      setHierarchyNotes(notesData)
      // Also create flat array for linking purposes
      setAllNotes(flattenHierarchy(notesData))
      setAllTags(tagsData)
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally {
      setIsLoading(false)
    }  }

  const loadNoteDetails = async (noteId: string) => {
    // Prevent loading the same note multiple times
    if (loadingNoteId.current === noteId) {
      console.log('Skipping loadNoteDetails for noteId:', noteId, '(already loading)')
      return
    }
    
    console.log('Loading note details for noteId:', noteId)
    loadingNoteId.current = noteId
    
    try {
      const noteWithLinks = await getNoteWithLinks(noteId, user.id)
      if (noteWithLinks) {
        // Update selectedNote only if it's still the current selection
        if (loadingNoteId.current === noteId) {
          console.log('Updating note data for noteId:', noteId)
          setSelectedNote(noteWithLinks)
          setNoteLinks([...noteWithLinks.links_from, ...noteWithLinks.links_to])
          setNoteTags(noteWithLinks.tags)
        }
      }
    } catch (error) {
      console.error('Failed to load note details:', error)
    } finally {
      // Clear the loading flag only if we're still loading the same note
      if (loadingNoteId.current === noteId) {
        loadingNoteId.current = null
      }
    }
  }

  const flattenHierarchy = (notes: NoteWithHierarchy[]): Note[] => {
    const result: Note[] = []
    for (const note of notes) {
      result.push(note)
      if (note.children) {
        result.push(...flattenHierarchy(note.children))
      }
    }
    return result
  }

  const handleCreateNote = async (parentId?: string) => {
    try {
      const newNote = await createNote(user.id, {
        title: 'New Note',
        content: '',
        parent_id: parentId || null,
        is_folder: false
      })

      if (newNote) {
        await loadUserData() // Reload hierarchy
        setSelectedNote(newNote)
        setIsEditing(true)
        showToast('New note created', 'success')
      } else {
        showToast('Failed to create note', 'error')
      }
    } catch (error) {
      showToast('Failed to create note', 'error')
    }
  }

  const handleCreateFolder = async (parentId?: string) => {
    try {
      const folderName = prompt('Enter folder name:')
      if (!folderName) return

      const newFolder = await createFolder(user.id, folderName, parentId)
      if (newFolder) {
        await loadUserData() // Reload hierarchy
        showToast('Folder created', 'success')
      } else {
        showToast('Failed to create folder', 'error')
      }
    } catch (error) {
      showToast('Failed to create folder', 'error')
    }
  }
  const handleSaveNote = async (noteId: string, title: string, content: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      })

      if (response.ok) {
        const updatedNote = await response.json()
        // Update both hierarchy and flat notes
        setAllNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note))
        setSelectedNote(updatedNote)
        await loadUserData() // Reload to ensure consistency
        showToast('Note saved', 'success')
      } else {
        showToast('Failed to save note', 'error')
      }
    } catch (error) {
      showToast('Failed to save note', 'error')
    }
  }
  const handleDeleteNote = async (noteId: string) => {
    // Find the note to show in confirmation
    const noteToDelete = allNotes.find(note => note.id === noteId)
    if (!noteToDelete) return

    setDeleteConfirm({
      isOpen: true,
      note: noteToDelete,
      isDeleting: false
    })
  }

  const confirmDeleteNote = async () => {
    if (!deleteConfirm.note) return

    // Set loading state
    setDeleteConfirm(prev => ({
      ...prev,
      isDeleting: true
    }))

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/notes/${deleteConfirm.note.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await loadUserData() // Reload hierarchy
        if (selectedNote?.id === deleteConfirm.note.id) {
          setSelectedNote(null)
          setIsEditing(false)
        }
        showToast('Note deleted', 'success')
      } else {
        showToast('Failed to delete note', 'error')
      }
    } catch (error) {
      showToast('Failed to delete note', 'error')
    } finally {
      setDeleteConfirm({
        isOpen: false,
        note: null,
        isDeleting: false
      })
    }
  }

  const cancelDeleteNote = () => {
    setDeleteConfirm({
      isOpen: false,
      note: null,
      isDeleting: false
    })
  }

  const handleSelectNote = (note: NoteWithHierarchy) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsSidebarOpen(false) // Close sidebar on mobile after selecting
    setShowNoteLinking(false) // Close note linking when switching notes
  }

  // Linking functions
  const handleCreateLink = async (targetNoteId: string, linkType: 'reference' | 'embed') => {
    if (!selectedNote) return

    try {
      const link = await createNoteLink(selectedNote.id, targetNoteId, linkType)
      if (link) {
        setNoteLinks(prev => [...prev, link])
        showToast('Link created', 'success')
      } else {
        showToast('Failed to create link', 'error')
      }
    } catch (error) {
      showToast('Failed to create link', 'error')
    }
  }
  
  // Function to open a linked note
  const handleOpenLinkedNote = (note: Note) => {
    if (note && note.id) {
      setSelectedNote(note)
      setIsEditing(false) // Switch to view mode
      showToast(`Opened note: ${note.title || 'Untitled'}`, 'info')
    }
  }

  const handleRemoveLink = async (linkId: string) => {
    try {
      const success = await removeNoteLink(linkId)
      if (success) {
        setNoteLinks(prev => prev.filter(link => link.id !== linkId))
        showToast('Link removed', 'success')
      } else {
        showToast('Failed to remove link', 'error')
      }
    } catch (error) {
      showToast('Failed to remove link', 'error')
    }
  }

  // Tagging functions
  const handleCreateTag = async (name: string, color: string) => {
    try {
      const tag = await createTag(user.id, name, color)
      if (tag) {
        setAllTags(prev => [...prev, tag])
        showToast('Tag created', 'success')
      } else {
        showToast('Failed to create tag', 'error')
      }
    } catch (error) {
      showToast('Failed to create tag', 'error')
    }
  }

  const handleAddTag = async (tagId: string) => {
    if (!selectedNote) return

    try {
      const success = await addTagToNote(selectedNote.id, tagId)
      if (success) {
        const tag = allTags.find(t => t.id === tagId)
        if (tag) {
          setNoteTags(prev => [...prev, tag])
          showToast('Tag added', 'success')
        }
      } else {
        showToast('Failed to add tag', 'error')
      }
    } catch (error) {
      showToast('Failed to add tag', 'error')
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!selectedNote) return

    try {
      const success = await removeTagFromNote(selectedNote.id, tagId)
      if (success) {
        setNoteTags(prev => prev.filter(tag => tag.id !== tagId))
        showToast('Tag removed', 'success')
      } else {
        showToast('Failed to remove tag', 'error')
      }
    } catch (error) {
      showToast('Failed to remove tag', 'error')
    }
  }

  // Handler untuk toggle note linking di mobile
  const handleToggleNoteLinking = () => {
    // Hanya toggle jika ada note yang dipilih
    if (!selectedNote) {
      showToast('Please select a note first', 'info')
      return
    }
    
    setShowNoteLinking(!showNoteLinking)
    // Jika note linking dibuka, tutup sidebar lainnya untuk memberikan lebih banyak ruang
    if (!showNoteLinking) {
      setIsSidebarOpen(false)
    }
  }
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500 border-opacity-25 mx-auto mb-4"></div>
          <SparklesIcon className="h-8 w-8 text-primary-500 animate-bounce mx-auto mb-2" />
          <p className="text-gray-600 font-medium">✨ Loading your magical notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Header */}
      <Header 
        user={user} 
        onLogout={onLogout} 
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex h-[calc(100vh-6rem)] lg:h-[calc(100vh-5rem)] items-stretch">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          </div>
        )}

        {/* Sidebar - Fixed height with proper scrolling */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-full max-w-sm lg:w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:top-0 lg:h-full mobile-sidebar
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full glass m-2 lg:m-2 flex flex-col shadow-2xl overflow-hidden">
            {/* Quick Actions - Fixed header */}
            <div className="flex-shrink-0 p-4 lg:p-2 border-b border-white/20">
              <h2 className="text-base lg:text-lg font-semibold text-gray-800 flex items-center">
                <StarIcon className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-500 mr-2 animate-pulse" />
                Your Notes
              </h2>
              <div className="flex space-x-4 lg:space-x-2">
                <button
                  onClick={() => handleCreateNote()}
                  className="p-2 lg:p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-110 shadow-lg group touch-target"
                  title="Create New Note ✨"
                >
                  <PlusIcon className="h-4 w-4 lg:h-5 lg:w-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-110 shadow-lg group touch-target"
                  title="Search Notes (Ctrl+K) 🔍"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform duration-300" />
                </button>
              </div>
  
            </div>

            {/* Notes View - Scrollable content area */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* View Toggle - Simplified */}
                <ViewToggle 
                  showLinkedNotes={showLinkedNotes}
                  onToggleLinkedNotes={setShowLinkedNotes}
                  viewMode="tree"
                  onToggleViewMode={() => {}} // Not used in simplified version
                />
                
                {/* Notes Content - Always Tree View */}
                <div className="flex-1 overflow-hidden">
                  <EnhancedNoteTree
                    userId={user.id}
                    selectedNoteId={selectedNote?.id}
                    onNoteSelect={handleSelectNote}
                    onCreateNote={handleCreateNote}
                    onDeleteNote={handleDeleteNote}
                    showLinkedNotes={showLinkedNotes}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content - Balanced height */}
        <div className="flex-1 p-2 lg:p-2 main-content-mobile h-full">
          <div className="h-full glass rounded-2xl overflow-hidden note-viewer-container flex flex-col">{selectedNote ? (
              isEditing ? (
                <div className="h-full">
                  <AdvancedBlockEditor
                    note={selectedNote}
                    onSave={handleSaveNote}
                    onCancel={() => setIsEditing(false)}
                    className="min-h-full"
                  />
                </div>
              ) : (
                <div className="h-full note-viewer-content">
                  <NoteViewer
                    note={selectedNote}
                    onEdit={() => setIsEditing(true)}
                    allNotes={allNotes}
                    noteLinks={noteLinks}
                    noteTags={noteTags}
                    allTags={allTags}
                    onCreateLink={handleCreateLink}
                    onRemoveLink={handleRemoveLink}
                    onOpenLinkedNote={handleOpenLinkedNote}
                    onCreateTag={handleCreateTag}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                  />
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="mb-8">
                    <SparklesIcon className="h-24 w-24 text-primary-400 mx-auto mb-4 animate-float" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-4">
                    Welcome to Your Creative Space! ✨
                  </h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Ready to capture your brilliant ideas? Select a note from the sidebar or create a new one to begin your journey of inspiration!
                  </p>
                  <button
                    onClick={() => handleCreateNote()}
                    className="btn-primary flex items-center mx-auto text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <PlusIcon className="h-6 w-6 mr-3" />
                    Create Your First Magical Note ✨
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    💡 Tip: Use Ctrl+N to quickly create a new note!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.note && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelDeleteNote}
          />
          
          {/* Modal */}
          <div className="relative glass rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Delete Note? 🗑️
              </h3>
              <p className="text-gray-600">
                This action cannot be undone and will permanently remove your note.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl mb-6">
              <p className="font-semibold text-gray-900 mb-1">
                "{deleteConfirm.note.title || 'Untitled'}"
              </p>
              {deleteConfirm.note.content && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {deleteConfirm.note.content.substring(0, 100)}...
                </p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={cancelDeleteNote}
                disabled={deleteConfirm.isDeleting}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${
                  deleteConfirm.isDeleting 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 hover:scale-105'
                }`}
              >
                Keep Note
              </button>
              <button
                onClick={confirmDeleteNote}
                disabled={deleteConfirm.isDeleting}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                  deleteConfirm.isDeleting 
                    ? 'bg-red-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105'
                } text-white`}
              >
                {deleteConfirm.isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                        fill="none"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Navigation */}
      <MobileNavigation 
        onCreateNote={() => handleCreateNote()}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleNoteLinking={handleToggleNoteLinking}
        selectedNote={selectedNote}
        isSidebarOpen={isSidebarOpen}
        showNoteLinking={showNoteLinking}
      />

      {/* Mobile Note Linking Bottom Sheet */}
      {showNoteLinking && selectedNote && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 mobile-note-linking-fade-in"
            onClick={() => setShowNoteLinking(false)}
          />
          
          {/* Bottom Sheet */}
          <div className={`mobile-note-linking-sheet ${showNoteLinking ? 'open' : ''} md:hidden`}>
            {/* Handle */}
            <div className="mobile-note-linking-handle"></div>
            
            {/* Header */}
            <div className="mobile-note-linking-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Note Links</h3>
                <button
                  onClick={() => setShowNoteLinking(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg touch-target"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              {selectedNote && (
                <div className="mt-2 text-sm text-gray-600">
                  Links for: <span className="font-medium">{selectedNote.title || 'Untitled'}</span>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="mobile-note-linking-content">
              <NoteLinking
                currentNote={selectedNote}
                availableNotes={allNotes}
                existingLinks={noteLinks}
                onCreateLink={handleCreateLink}
                onRemoveLink={handleRemoveLink}
                onOpenLinkedNote={handleOpenLinkedNote}
              />
            </div>
          </div>
        </>
      )}

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        notes={allNotes}
        onSelectNote={(note) => {
          setSelectedNote(note)
          setViewMode('tree') // Switch to tree view when note is selected
          setIsSidebarOpen(false) // Close sidebar on mobile when note is selected
        }}
      />
    </div>
  )
}
