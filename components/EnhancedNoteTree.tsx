'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { 
  FolderIcon, 
  DocumentTextIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  HeartIcon,
  EyeIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { FolderIcon as FolderSolidIcon } from '@heroicons/react/24/solid'
import type { NoteWithHierarchy } from '../lib/supabase'
import { getUnlinkedNotesHierarchy, getNotesHierarchy } from '../lib/notes'

interface EnhancedNoteTreeProps {
  userId: string
  onNoteSelect: (note: NoteWithHierarchy) => void
  onCreateNote: (parentId?: string) => void
  onDeleteNote?: (noteId: string) => void
  onMoveNote?: (noteId: string, newParentId: string | null) => void
  selectedNoteId?: string
  showLinkedNotes?: boolean
}

interface TreeNodeProps {
  note: NoteWithHierarchy
  level: number
  onNoteSelect: (note: NoteWithHierarchy) => void
  onCreateNote: (parentId?: string) => void
  onDeleteNote?: (noteId: string) => void
  selectedNoteId?: string
  children: NoteWithHierarchy[]
}

const TreeNode = memo(function TreeNode({ note, level, onNoteSelect, onCreateNote, onDeleteNote, selectedNoteId, children }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels
  const [showActions, setShowActions] = useState(false)

  const hasChildren = children.length > 0
  const isSelected = selectedNoteId === note.id

  const handleToggle = useCallback(() => {
    if (hasChildren || note.is_folder) {
      setIsExpanded(!isExpanded)
    }
  }, [hasChildren, note.is_folder, isExpanded])

  const handleNoteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onNoteSelect(note)
  }, [onNoteSelect, note])

  const handleCreateNote = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onCreateNote(note.id)
  }, [onCreateNote, note.id])


  const handleDeleteNote = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteNote?.(note.id)
  }, [onDeleteNote, note.id])

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-3 px-1 rounded-xl cursor-pointer group transition-all duration-200
          ${isSelected 
            ? 'bg-gradient-to-r from-primary-100 to-secondary-100 shadow-md transform scale-105' 
            : 'hover:bg-white/50 hover:shadow-sm hover:transform hover:scale-102'
          }
        `}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={handleToggle}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/70 transition-colors duration-200"
        >
          {hasChildren || note.is_folder ? (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-primary-600" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-primary-600" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Icon */}
        <div className="flex-shrink-0 relative">
          {note.is_folder ? (
            <div className="relative">
              {isExpanded ? (
                <FolderSolidIcon className="w-5 h-5 text-accent-500" />
              ) : (
                <FolderIcon className="w-5 h-5 text-accent-500" />
              )}
              {children.length > 0 && (
                <SparklesIcon className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
              )}
            </div>
          ) : (
            <div className="relative">
              <DocumentTextIcon className="w-5 h-5 text-primary-600" />
              {isSelected && (
                <SparklesIcon className="w-3 h-3  text-yellow-400 absolute -top-1 -right-1 animate-bounce-gentle" />
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <span
          onClick={handleNoteClick}
          className={`
            flex-1 text-sm truncate font-medium transition-colors duration-200
            ${isSelected 
              ? 'text-primary-800 font-semibold' 
              : 'text-gray-700 group-hover:text-primary-700'
            }
          `}
        >
          {note.title || 'Untitled'}
          {isSelected && (
            <span className="ml-2 text-xs text-primary-500">✨</span>
          )}
        </span>

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={handleCreateNote}
              className="p-2 rounded-lg bg-gradient-to-r from-primary-400 to-primary-500 text-white hover:from-primary-500 hover:to-primary-600 transition-all duration-200 hover:scale-110 shadow-lg"
              title="Add note ✨"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
            {onDeleteNote && (
              <button
                onClick={handleDeleteNote}
                className="p-2 rounded-lg bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600 transition-all duration-200 hover:scale-110 shadow-lg"
                title="Delete 🗑️"
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              note={child}
              level={level + 1}
              onNoteSelect={onNoteSelect}
              onCreateNote={onCreateNote}
              onDeleteNote={onDeleteNote}
              selectedNoteId={selectedNoteId}
              children={[]} // We'll need to filter children for each node
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default function EnhancedNoteTree({ 
  userId,
  onNoteSelect, 
  onCreateNote, 
  onDeleteNote,
  selectedNoteId,
  showLinkedNotes = false
}: EnhancedNoteTreeProps) {
  const [notes, setNotes] = useState<NoteWithHierarchy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotes()
  }, [userId, showLinkedNotes])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const fetchedNotes = showLinkedNotes 
        ? await getNotesHierarchy(userId)
        : await getUnlinkedNotesHierarchy(userId)
      setNotes(fetchedNotes)
    } catch (error) {
      console.error('Error loading notes hierarchy:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoize expensive tree building operation
  const treeData = useMemo(() => {
    // Build tree structure from flat array
    const buildTree = (notes: NoteWithHierarchy[]) => {
      const nodeMap = new Map<string, NoteWithHierarchy & { children: NoteWithHierarchy[] }>()
      const rootNodes: (NoteWithHierarchy & { children: NoteWithHierarchy[] })[] = []

      // Create map of all nodes
      notes.forEach(note => {
        nodeMap.set(note.id, { ...note, children: [] })
      })

      // Build tree structure
      notes.forEach(note => {
        const node = nodeMap.get(note.id)!
        if (note.parent_id) {
          const parent = nodeMap.get(note.parent_id)
          if (parent) {
            parent.children.push(node)
          } else {
            rootNodes.push(node) // Orphaned node
          }
        } else {
          rootNodes.push(node)
        }
      })

      // Sort nodes by sort_order and title - memoized sorting
      const sortNodes = (nodes: any[]) => {
        nodes.sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order
          }
          return a.title.localeCompare(b.title)
        })
        nodes.forEach(node => sortNodes(node.children))
      }

      sortNodes(rootNodes)
      return rootNodes
    }

    return buildTree(notes)
  }, [notes])

  // Memoize callbacks to prevent unnecessary re-renders
  const memoizedOnNoteSelect = useCallback((note: NoteWithHierarchy) => {
    onNoteSelect(note)
  }, [onNoteSelect])

  const memoizedOnCreateNote = useCallback((parentId?: string) => {
    onCreateNote(parentId)
    // Reload notes after creation
    setTimeout(() => loadNotes(), 100)
  }, [onCreateNote])

  const memoizedOnDeleteNote = useCallback((noteId: string) => {
    onDeleteNote?.(noteId)
    // Reload notes after deletion
    setTimeout(() => loadNotes(), 100)
  }, [onDeleteNote])

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Loading notes...</p>
      </div>
    )
  }

  if (treeData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>
          {showLinkedNotes ? 'No notes yet' : 'No unlinked notes'}
        </p>
        <button
          onClick={() => memoizedOnCreateNote()}
          className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showLinkedNotes ? 'Create your first note' : 'Create a new note'}
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
        {treeData.map((node) => (
          <TreeNode
            key={node.id}
            note={node}
            level={0}
            onNoteSelect={memoizedOnNoteSelect}
            onCreateNote={memoizedOnCreateNote}
            onDeleteNote={memoizedOnDeleteNote}
            selectedNoteId={selectedNoteId}
            children={node.children || []}
          />
        ))}
      </div>
    </div>
  )
}
