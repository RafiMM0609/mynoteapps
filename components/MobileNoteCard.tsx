'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'

interface MobileNoteCardProps {
  note: Note
  isSelected: boolean
  searchQuery: string
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
  highlightMatches: boolean
}

export default function MobileNoteCard({
  note,
  isSelected,
  searchQuery,
  onSelect,
  onDelete,
  highlightMatches
}: MobileNoteCardProps) {
  
  const highlightText = (text: string, query: string): string => {
    if (!query.trim() || !highlightMatches) return text
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded-sm font-medium">$1</mark>')
  }

  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div
      className={`
        relative p-5 mb-4 rounded-2xl cursor-pointer transition-all duration-200 min-h-[100px] shadow-sm
        ${isSelected 
          ? 'bg-blue-50 border-2 border-blue-200 shadow-md' 
          : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-md active:scale-[0.98]'
        }
      `}
      onClick={onSelect}
    >
      {/* Header with title and delete button */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center space-x-3">
            <h3 
              className="text-lg font-semibold text-gray-900 leading-tight"
              dangerouslySetInnerHTML={{
                __html: highlightText(note.title || 'Untitled', searchQuery)
              }}
            />
            {note.is_folder && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 shrink-0">
                Folder
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 shrink-0"
          title="Delete note"
        >
          <TrashIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Content preview */}
      {note.content && (
        <div 
          className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{
            __html: highlightText(truncateContent(note.content), searchQuery)
          }}
        />
      )}

      {/* Footer with timestamp */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">
          Last updated: {formatDate(note.updated_at)}
        </span>
        
        {/* Visual indicator for selection */}
        {isSelected && (
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        )}
      </div>
    </div>
  )
}
