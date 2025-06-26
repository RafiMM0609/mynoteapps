'use client'

import { 
  HomeIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  Bars3Icon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline'

interface MobileNavigationProps {
  onCreateNote: () => void
  onOpenSearch: () => void
  onToggleSidebar: () => void
  selectedNote: any
  isSidebarOpen: boolean
}

export default function MobileNavigation({ 
  onCreateNote, 
  onOpenSearch, 
  onToggleSidebar, 
  selectedNote,
  isSidebarOpen 
}: MobileNavigationProps) {
  return (
    <div className="mobile-nav lg:hidden">
      <div className="flex items-center justify-around">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 touch-target ${
            isSidebarOpen 
              ? 'text-indigo-600 bg-indigo-50' 
              : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
          }`}
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Menu</span>
        </button>

        {/* Current Note */}
        <button
          className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 touch-target text-gray-600"
          disabled
        >
          <DocumentTextIcon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium truncate max-w-[60px]">
            {selectedNote ? selectedNote.title || 'Note' : 'No Note'}
          </span>
        </button>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 touch-target text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
          aria-label="Search notes"
        >
          <MagnifyingGlassIcon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Search</span>
        </button>

        {/* Create Note */}
        <button
          onClick={onCreateNote}
          className="flex flex-col items-center p-2 rounded-lg transition-all duration-200 touch-target bg-indigo-600 text-white hover:bg-indigo-700"
          aria-label="Create new note"
        >
          <PlusIcon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Create</span>
        </button>
      </div>
    </div>
  )
}
