'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import NoteList from './NoteList'
import NoteEditor from './NoteEditor_new'
import NoteViewer from './NoteViewer'
import type { AuthUser } from '../lib/auth'
import type { Note } from '../lib/supabase'
import type { ToastMessage } from '../hooks/useToast'

interface AuthenticatedHomeProps {
  user: AuthUser
  onLogout: () => void
  showToast: (message: string, type: ToastMessage['type']) => void
}

export default function AuthenticatedHome({ user, onLogout, showToast }: AuthenticatedHomeProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user notes
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const notesData = await response.json()
        setNotes(notesData)
      } else {
        showToast('Failed to load notes', 'error')
      }
    } catch (error) {
      showToast('Failed to load notes', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
        }),
      })

      if (response.ok) {
        const newNote = await response.json()
        setNotes(prev => [newNote, ...prev])
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
        setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note))
        setSelectedNote(updatedNote)
        showToast('Note saved', 'success')
      } else {
        showToast('Failed to save note', 'error')
      }
    } catch (error) {
      showToast('Failed to save note', 'error')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId))
        if (selectedNote?.id === noteId) {
          setSelectedNote(null)
          setIsEditing(false)
        }
        showToast('Note deleted', 'success')
      } else {
        showToast('Failed to delete note', 'error')
      }
    } catch (error) {
      showToast('Failed to delete note', 'error')
    }
  }

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsSidebarOpen(false) // Close sidebar on mobile after selecting
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
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900">MyNotes</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateNote}
                className="btn-primary p-2"
                title="New Note (Ctrl+N)"
              >
                <PlusIcon className="h-5 w-5" />
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
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-hidden">
            <NoteList
              notes={notes}
              selectedNote={selectedNote}
              onSelectNote={handleSelectNote}
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
          <h1 className="text-lg font-semibold text-gray-900">MyNotes</h1>
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
              />
            ) : (
              <NoteViewer
                note={selectedNote}
                onEdit={() => setIsEditing(true)}
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center bg-white">
              <div className="text-center">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">Welcome to MyNotes</h2>
                <p className="text-gray-600 mb-6">Select a note to view or create a new one to get started.</p>
                <button
                  onClick={handleCreateNote}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create your first note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
