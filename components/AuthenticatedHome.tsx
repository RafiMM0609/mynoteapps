'use client'

import { useState, useEffect, useRef } from 'react'
import { PlusIcon, Bars3Icon, XMarkIcon, FolderIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import NoteTree from './NoteTree'
import NoteEditor from './NoteEditor_new'
import NoteViewer from './NoteViewer'
import NoteLinking from './NoteLinking'
import NoteTags from './NoteTags'
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading notes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900">Kagita Notes</h1>
            </div>            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCreateNote()}
                className="btn-primary p-2"
                title="New Note (Ctrl+N)"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleCreateFolder()}
                className="btn-secondary p-2"
                title="New Folder"
              >
                <FolderIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Signed in as</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign out
              </button>
            </div>
          </div>          {/* Notes tree */}
          <div className="flex-1 flex flex-col overflow-hidden">            <NoteTree
              notes={hierarchyNotes}
              selectedNoteId={selectedNote?.id}
              onNoteSelect={handleSelectNote}
              onCreateNote={handleCreateNote}
              onCreateFolder={handleCreateFolder}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Kagita Notes</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Editor/Viewer */}
        <div className="flex-1">
          {selectedNote ? (
            isEditing ? (
              <NoteEditor
                note={selectedNote}
                onSave={handleSaveNote}
                onCancel={() => setIsEditing(false)}
              />            ) : (              <NoteViewer
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
            )
          ) : (
            <div className="h-full flex items-center justify-center bg-white p-4 sm:p-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-4">Welcome to Kagita Notes</h2>
                <p className="text-gray-600 mb-6">Select a note to view or create a new one to get started.</p>                <button
                  onClick={() => handleCreateNote()}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create your first note
                </button>              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.note && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cancelDeleteNote}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Note
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">
                Are you sure you want to delete this note? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-900">
                  {deleteConfirm.note.title || 'Untitled'}
                </p>
                {deleteConfirm.note.content && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {deleteConfirm.note.content.substring(0, 100)}...
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteNote}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteNote}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
