'use client'

import { useState } from 'react'
import { TrashIcon, ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline'

interface DemoNote {
  id: string
  title: string
  content: string
  created_at: string
}

export default function DeleteUXDemo() {
  const [notes, setNotes] = useState<DemoNote[]>([
    {
      id: '1',
      title: 'Important Meeting Notes',
      content: 'This is an important note with meeting details...',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Project Ideas',
      content: 'List of creative project ideas for the next quarter...',
      created_at: '2024-01-14T14:20:00Z'
    },
    {
      id: '3',
      title: 'Shopping List',
      content: 'Groceries and household items to buy...',
      created_at: '2024-01-13T09:15:00Z'
    }
  ])

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<DemoNote | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleDeleteClick = (note: DemoNote) => {
    setNoteToDelete(note)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return

    setIsDeleting(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setNotes(prev => prev.filter(note => note.id !== noteToDelete.id))
    setIsDeleting(false)
    setShowDeleteModal(false)
    setShowSuccess(true)
    setNoteToDelete(null)

    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setNoteToDelete(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delete UX Demo</h1>
          <p className="mt-2 text-gray-600">
            Demonstration of user-friendly delete confirmation patterns
          </p>
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <CheckIcon className="h-5 w-5" />
            <span>Note deleted successfully</span>
          </div>
        )}

        {/* Notes List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Notes</h2>
            <p className="text-gray-600">Click the delete button to see the confirmation flow</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {notes.map((note) => (
              <div key={note.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{note.title}</h3>
                    <p className="mt-1 text-gray-600 line-clamp-2">{note.content}</p>
                    <p className="mt-2 text-sm text-gray-400">
                      Created: {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(note)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete note"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            
            {notes.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <TrashIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>All notes have been deleted</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-blue-500 hover:text-blue-600"
                >
                  Refresh to reset demo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Delete Note
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to delete "{noteToDelete?.title}"? This action cannot be undone.
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleConfirmDelete}
                      disabled={isDeleting}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      disabled={isDeleting}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UX Principles */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete UX Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Good Practices</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Clear confirmation dialog</li>
                <li>• Show what will be deleted</li>
                <li>• Warn about irreversible actions</li>
                <li>• Loading states during deletion</li>
                <li>• Success feedback after completion</li>
                <li>• Easy-to-click cancel button</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">❌ Avoid</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Instant deletion without confirmation</li>
                <li>• Ambiguous button labels</li>
                <li>• No feedback after deletion</li>
                <li>• Hard-to-access undo options</li>
                <li>• Destructive actions as primary buttons</li>
                <li>• No indication of permanent loss</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
