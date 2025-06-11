'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NoteList from '@/components/NoteList'
import NoteEditor from '@/components/NoteEditor'
import NoteViewer from '@/components/NoteViewer'
import AuthenticatedHome from '@/components/AuthenticatedHome'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

export interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showNotes, setShowNotes] = useState(false)
  const { toast, showToast, hideToast } = useToast()
  const router = useRouter()

  const fetchNotes = useCallback(async () => {
    if (!authToken) return
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    checkAuthStatus()
  }, [])
    useEffect(() => {
    if (authToken && showNotes) {
      fetchNotes()
    }
  }, [authToken, showNotes, fetchNotes])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && showNotes && !isEditing) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            handleCreateNote()
            break
        }
      }
    }

    if (showNotes) {
      document.addEventListener('keydown', handleGlobalKeyDown)
      return () => document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [showNotes, isEditing])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsCheckingAuth(false)
        return
      }

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setAuthToken(token)
      } else {
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      localStorage.removeItem('auth_token')    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleCreateNote = () => {
    setSelectedNote(null)
    setIsEditing(true)
    setIsSidebarOpen(false)
  }

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(false)
    setIsSidebarOpen(false)
  }

  const handleEditNote = () => {
    setIsEditing(true)
  }
  const handleSaveNote = async (title: string, content: string) => {
    if (!authToken) return

    try {
      const method = selectedNote ? 'PUT' : 'POST'
      const url = selectedNote ? `/api/notes/${selectedNote.id}` : '/api/notes'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ title, content }),
      })

      if (response.ok) {
        const savedNote = await response.json()
        if (selectedNote) {
          setNotes(notes.map(note => note.id === savedNote.id ? savedNote : note))
          setSelectedNote(savedNote)
          showToast(
            `Note updated successfully`, 
            'success'
          )
        } else {
          setNotes([savedNote, ...notes])
          setSelectedNote(savedNote)
          showToast(
            `Note "${title}" created successfully`, 
            'success'
          )
        }
        setIsEditing(false)
      } else {
        showToast('Failed to save note. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      showToast('Network error. Please check your connection.', 'error')
    }
  }
  const handleDeleteNote = async (noteId: string) => {
    if (!authToken) return

    const noteToDelete = notes.find(note => note.id === noteId)
    const noteTitle = noteToDelete?.title || 'Untitled'

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId))
        if (selectedNote?.id === noteId) {
          setSelectedNote(null)
          setIsEditing(false)
        }
        showToast(`Note "${noteTitle}" deleted successfully`, 'info')
      } else {
        showToast('Failed to delete note. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      showToast('Network error. Please check your connection.', 'error')
    }
  }
  const handleCancelEdit = () => {
    setIsEditing(false)
    if (!selectedNote) {
      setSelectedNote(null)
    }
  }

  const handleGoToNotes = () => {
    setShowNotes(true)
  }

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/verify', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      } catch (error) {
        console.error('Error during logout:', error)
      }
    }
    
    localStorage.removeItem('auth_token')
    setAuthToken(null)
    setShowNotes(false)
    setNotes([])
    setSelectedNote(null)
    setIsEditing(false)
  }

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    )  }

  // Redirect to login if not authenticated
  if (!authToken) {
    router.push('/login')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-black">
        <div className="text-white">Redirecting to login...</div>
      </div>
    )
  }

  // Show "Go to Notes" screen if authenticated but not viewing notes yet
  if (!showNotes) {
    return (
      <AuthenticatedHome 
        onGoToNotes={handleGoToNotes}
        onLogout={handleLogout}
      />
    )
  }

  // Show the main notes application
  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">MyNotes</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateNote}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 
        fixed md:relative 
        w-80 md:w-80 
        bg-white border-r border-gray-200 
        flex flex-col 
        z-30 md:z-auto
        transition-transform duration-300 ease-in-out
        h-full
      `}>
        <div className="p-4 border-b border-gray-200 mt-16 md:mt-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800 hidden md:block">MyNotes</h1>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <button
                onClick={handleCreateNote}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm flex-1 md:flex-none"
              >
                New Note
              </button>
              <button
                onClick={handleLogout}
                className="hidden md:block p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <NoteList
            notes={notes}
            selectedNote={selectedNote}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col mt-16 md:mt-0">
        {isEditing ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSaveNote}
            onCancel={handleCancelEdit}
          />
        ) : selectedNote ? (
          <NoteViewer
            note={selectedNote}
            onEdit={handleEditNote}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 md:w-12 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg md:text-xl font-medium text-gray-600 mb-2">Welcome to MyNotes</h2>
              <p className="text-sm md:text-base text-gray-500 mb-4">Create a new note or select an existing one to get started</p>
              <button
                onClick={handleCreateNote}
                className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors w-full md:w-auto"
              >
                Create Your First Note
              </button>
            </div>
          </div>        )}
      </div>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}