'use client'

import { useState } from 'react'
import { LinkIcon } from '@heroicons/react/24/outline'

interface ViewToggleProps {
  showLinkedNotes: boolean
  onToggleLinkedNotes: (show: boolean) => void
  viewMode?: 'list' | 'tree' // Optional since we're not using it
  onToggleViewMode?: (mode: 'list' | 'tree') => void // Optional since we're not using it
}

export default function ViewToggle({ 
  showLinkedNotes, 
  onToggleLinkedNotes, 
  viewMode, 
  onToggleViewMode 
}: ViewToggleProps) {
  return (
    <div className="p-3 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
        
        {/* Simplified Toggle - Only Main/All */}
        <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => onToggleLinkedNotes(false)}
            className={`
              px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center space-x-2
              ${!showLinkedNotes 
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
            title="Show only unlinked notes (cleaner view)"
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span>Main</span>
          </button>
          <button
            onClick={() => onToggleLinkedNotes(true)}
            className={`
              px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center space-x-2
              ${showLinkedNotes 
                ? 'bg-gray-600 text-white' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
            title="Show all notes including linked ones"
          >
            <LinkIcon className="w-4 h-4" />
            <span>All</span>
          </button>
        </div>
      </div>
      
      {/* Description */}
      <div className="mt-2">
        <p className="text-xs text-gray-500">
          {showLinkedNotes 
            ? 'Showing all notes including linked notes' 
            : 'Showing only main notes (not linked by other notes) for cleaner organization'
          }
        </p>
      </div>
    </div>
  )
}
