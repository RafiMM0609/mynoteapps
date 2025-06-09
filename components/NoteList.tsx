import type { Note } from '@/app/page'

interface NoteListProps {
  notes: Note[]
  selectedNote: Note | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  isLoading: boolean
}

export default function NoteList({ 
  notes, 
  selectedNote, 
  onSelectNote, 
  onDeleteNote, 
  isLoading 
}: NoteListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    // Remove HTML tags for preview
    const textContent = content.replace(/<[^>]*>/g, '')
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 text-sm">No notes yet. Create your first note!</p>
      </div>
    )
  }

  return (
    <div className="p-2">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors group relative ${
            selectedNote?.id === note.id
              ? 'bg-gray-100 border border-gray-200'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelectNote(note)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 truncate text-sm mb-1">
                {note.title || 'Untitled'}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {formatDate(note.updated_at)}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">
                {truncateContent(note.content)}
              </p>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Are you sure you want to delete this note?')) {
                  onDeleteNote(note.id)
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 text-gray-400 hover:text-red-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
