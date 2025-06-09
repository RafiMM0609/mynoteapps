'use client'

import { useState, useEffect } from 'react'
import NoteList from '@/components/NoteList'
import NoteEditor from '@/components/NoteEditor'
import NoteViewer from '@/components/NoteViewer'

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

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notes')
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = () => {
    setSelectedNote(null)
    setIsEditing(true)
  }

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(false)
  }

  const handleEditNote = () => {
    setIsEditing(true)
  }

  const handleSaveNote = async (title: string, content: string) => {
    try {
      const method = selectedNote ? 'PUT' : 'POST'
      const url = selectedNote ? `/api/notes/${selectedNote.id}` : '/api/notes'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      })

      if (response.ok) {
        const savedNote = await response.json()
        if (selectedNote) {
          setNotes(notes.map(note => note.id === savedNote.id ? savedNote : note))
          setSelectedNote(savedNote)
        } else {
          setNotes([savedNote, ...notes])
          setSelectedNote(savedNote)
        }
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId))
        if (selectedNote?.id === noteId) {
          setSelectedNote(null)
          setIsEditing(false)
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (!selectedNote) {
      setSelectedNote(null)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800">MyNotes</h1>
            <button
              onClick={handleCreateNote}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              New Note
            </button>
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
      <div className="flex-1 flex flex-col">
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
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-gray-600 mb-2">Welcome to MyNotes</h2>
              <p className="text-gray-500 mb-4">Create a new note or select an existing one to get started</p>
              <button
                onClick={handleCreateNote}
                className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Create Your First Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
