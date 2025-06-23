'use client'

import { useState } from 'react'
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'
import Backlinks from './Backlinks'

interface NoteLinkingSidebarProps {
  currentNote: Note
  allNotes: Note[]
  onNoteClick?: (note: Note) => void
  className?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function NoteLinkingSidebar({ 
  currentNote, 
  allNotes, 
  onNoteClick,
  className = "",
  isCollapsed = false,
  onToggleCollapse
}: NoteLinkingSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (isCollapsed) {
    return (
      <div className={`w-12 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-150"
          title="Expand note links"
        >
          <LinkIcon className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className={`w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Note Links
          </h2>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
          
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
              title="Collapse sidebar"
            >
              <ChevronRightIcon className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <Backlinks
              currentNote={currentNote}
              allNotes={allNotes}
              onNoteClick={onNoteClick}
            />
          </div>
        </div>
      )}

      {!isExpanded && (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Collapsed</p>
        </div>
      )}
    </div>
  )
}
