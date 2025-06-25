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
import NoteEditor from './NoteEditor_new'
import NoteViewer from './NoteViewer'
import NoteLinking from './NoteLinking'
import NoteTags from './NoteTags'
import SearchableNoteList from './SearchableNoteList'
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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    note: Note | null
  }>({
    isOpen: false,
    note: null
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
  }, [])  // Load note details when selected note ID changes
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
        title: 'Untitled Note',
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
      note: noteToDelete
    })
  }

  const confirmDeleteNote = async () => {
    if (!deleteConfirm.note) return

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
        note: null
      })
    }
  }

  const cancelDeleteNote = () => {
    setDeleteConfirm({
      isOpen: false,
      note: null
    })
  }

  const handleSelectNote = (note: NoteWithHierarchy) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsSidebarOpen(false) // Close sidebar on mobile after selecting
  }

  // Wrapper for SearchableNoteList which expects regular Note type
  const handleSelectNoteFromSearch = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsSidebarOpen(false) // Close sidebar on mobile after selecting
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
    <div className="min-h-screen">
      {/* Header */}
      <Header 
        user={user} 
        onLogout={onLogout} 
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex h-screen pt-20"> {/* pt-20 to account for fixed header */}
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          </div>
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 top-20 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:top-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full glass m-4 p-6 flex flex-col shadow-2xl">
            {/* Quick Actions */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  Your Notes
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCreateNote()}
                    className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 hover:scale-110 shadow-lg group"
                    title="Create New Note ✨"
                  >
                    <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                  <button
                    onClick={() => handleCreateFolder()}
                    className="p-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all duration-300 hover:scale-110 shadow-lg group"
                    title="Create New Folder 📁"
                  >
                    <FolderIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="mb-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'tree'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4 mr-2" />
                    Tree View
                  </button>
                  <button
                    onClick={() => setViewMode('search')}
                    className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === 'search'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    Search
                  </button>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{allNotes.length}</p>
                    <p className="text-sm text-purple-600">Total Notes</p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Notes View - Tree or Search */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'tree' ? (
                <NoteTree
                  notes={hierarchyNotes}
                  selectedNoteId={selectedNote?.id}
                  onNoteSelect={handleSelectNote}
                  onCreateNote={handleCreateNote}
                  onCreateFolder={handleCreateFolder}
                  onDeleteNote={handleDeleteNote}
                />
              ) : (
                <SearchableNoteList
                  notes={allNotes}
                  selectedNote={selectedNote}
                  onSelectNote={handleSelectNoteFromSearch}
                  onDeleteNote={handleDeleteNote}
                />
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          <div className="h-full glass rounded-2xl overflow-hidden shadow-2xl">
            {selectedNote ? (
              isEditing ? (
                <div className="h-full">
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center">
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Editing: {selectedNote.title || 'Untitled Note'}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                  <NoteEditor
                    note={selectedNote}
                    onSave={handleSaveNote}
                    onCancel={() => setIsEditing(false)}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center">
                        <HeartIcon className="h-5 w-5 mr-2 text-pink-200" />
                        {selectedNote.title || 'Untitled Note'}
                      </h3>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
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
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="mb-8">
                    <SparklesIcon className="h-24 w-24 text-primary-400 mx-auto mb-4 animate-float" />
                    <HeartIcon className="h-8 w-8 text-pink-400 mx-auto animate-bounce-gentle" />
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
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all duration-200 hover:scale-105"
              >
                Keep Note
              </button>
              <button
                onClick={confirmDeleteNote}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
