'use client'

import { useState, useEffect } from 'react'
import { 
  TagIcon, 
  XMarkIcon, 
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import type { NoteTag } from '../lib/supabase'

interface NoteTagsProps {
  noteTags: NoteTag[]
  availableTags: NoteTag[]
  onAddTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
  onCreateTag: (name: string, color: string) => void
}

const TAG_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]

export default function NoteTags({ 
  noteTags, 
  availableTags, 
  onAddTag, 
  onRemoveTag, 
  onCreateTag 
}: NoteTagsProps) {
  const [showTagModal, setShowTagModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTags, setFilteredTags] = useState<NoteTag[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  useEffect(() => {
    // Filter available tags based on search and exclude already applied tags
    const noteTagIds = new Set(noteTags.map(tag => tag.id))
    
    let filtered = availableTags.filter(tag => 
      !noteTagIds.has(tag.id) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    setFilteredTags(filtered)
  }, [searchQuery, availableTags, noteTags])

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim(), newTagColor)
      setNewTagName('')
      setNewTagColor(TAG_COLORS[0])
      setShowCreateForm(false)
    }
  }

  const handleAddTag = (tag: NoteTag) => {
    onAddTag(tag.id)
    setShowTagModal(false)
    setSearchQuery('')
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <TagIcon className="w-4 h-4" />
          Tags ({noteTags.length})
        </h3>
        <button
          onClick={() => setShowTagModal(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
        >
          <PlusIcon className="w-3 h-3" />
          Add Tag
        </button>
      </div>

      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        {noteTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white group"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => onRemoveTag(tag.id)}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}

        {noteTags.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No tags applied
          </p>
        )}
      </div>

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add Tags
              </h3>
              <button
                onClick={() => {
                  setShowTagModal(false)
                  setSearchQuery('')
                  setShowCreateForm(false)
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Create New Tag */}
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors mb-4"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create new tag
                </button>
              )}

              {/* Create Tag Form */}
              {showCreateForm && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                  
                  {/* Color Picker */}
                  <div className="flex gap-1 mb-2">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newTagColor === color ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewTagName('')
                        setNewTagColor(TAG_COLORS[0])
                      }}
                      className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Available Tags */}
              <div className="max-h-48 overflow-y-auto">
                {filteredTags.length > 0 ? (
                  <div className="space-y-1">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleAddTag(tag)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {tag.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <TagIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery ? 'No tags found' : 'No available tags'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
