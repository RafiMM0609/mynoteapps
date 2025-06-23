'use client'

import { useState, useEffect } from 'react'
import { 
  FolderIcon, 
  DocumentTextIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { FolderIcon as FolderSolidIcon } from '@heroicons/react/24/solid'
import type { NoteWithHierarchy } from '../lib/supabase'

interface NoteTreeProps {
  notes: NoteWithHierarchy[]
  onNoteSelect: (note: NoteWithHierarchy) => void
  onCreateNote: (parentId?: string) => void
  onCreateFolder: (parentId?: string) => void
  onDeleteNote?: (noteId: string) => void
  onMoveNote?: (noteId: string, newParentId: string | null) => void
  selectedNoteId?: string
}

interface TreeNodeProps {
  note: NoteWithHierarchy
  level: number
  onNoteSelect: (note: NoteWithHierarchy) => void
  onCreateNote: (parentId?: string) => void
  onCreateFolder: (parentId?: string) => void
  onDeleteNote?: (noteId: string) => void
  selectedNoteId?: string
  children: NoteWithHierarchy[]
}

function TreeNode({ note, level, onNoteSelect, onCreateNote, onCreateFolder, onDeleteNote, selectedNoteId, children }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels
  const [showActions, setShowActions] = useState(false)

  const hasChildren = children.length > 0
  const isSelected = selectedNoteId === note.id

  const handleToggle = () => {
    if (hasChildren || note.is_folder) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleNoteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNoteSelect(note)
  }

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer group
          hover:bg-gray-100 dark:hover:bg-gray-700
          ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
        `}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={handleToggle}
          className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {hasChildren || note.is_folder ? (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Icon */}
        <div className="flex-shrink-0">
          {note.is_folder ? (
            isExpanded ? (
              <FolderSolidIcon className="w-4 h-4 text-blue-500" />
            ) : (
              <FolderIcon className="w-4 h-4 text-blue-500" />
            )
          ) : (
            <DocumentTextIcon className="w-4 h-4 text-gray-500" />
          )}
        </div>

        {/* Title */}
        <span
          onClick={handleNoteClick}
          className={`
            flex-1 text-sm truncate
            ${isSelected ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
          `}
        >
          {note.title || 'Untitled'}
        </span>        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateNote(note.id)
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Add note"
            >
              <PlusIcon className="w-3 h-3 text-gray-500" />
            </button>
            {note.is_folder && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateFolder(note.id)
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Add folder"
              >
                <FolderIcon className="w-3 h-3 text-gray-500" />
              </button>
            )}
            {onDeleteNote && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteNote(note.id)
                }}
                className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-800"
                title="Delete"
              >
                <TrashIcon className="w-3 h-3 text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              note={child}
              level={level + 1}
              onNoteSelect={onNoteSelect}
              onCreateNote={onCreateNote}
              onCreateFolder={onCreateFolder}
              onDeleteNote={onDeleteNote}
              selectedNoteId={selectedNoteId}
              children={[]} // We'll need to filter children for each node
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function NoteTree({ 
  notes, 
  onNoteSelect, 
  onCreateNote, 
  onCreateFolder, 
  onDeleteNote,
  selectedNoteId 
}: NoteTreeProps) {
  const [treeData, setTreeData] = useState<NoteWithHierarchy[]>([])

  useEffect(() => {
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

      // Sort nodes by sort_order and title
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

    setTreeData(buildTree(notes))
  }, [notes])

  if (treeData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No notes yet</p>
        <button
          onClick={() => onCreateNote()}
          className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Create your first note
        </button>
      </div>
    )
  }
  return (
    <div className="h-full flex flex-col py-2">
      {/* Root level actions */}
      <div className="flex gap-2 px-2 mb-2">
        <button
          onClick={() => onCreateNote()}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <PlusIcon className="w-3 h-3" />
          Note
        </button>
        <button
          onClick={() => onCreateFolder()}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <FolderIcon className="w-3 h-3" />
          Folder
        </button>
      </div>      {/* Tree nodes */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
        {treeData.map((node) => (
          <TreeNode
            key={node.id}
            note={node}
            level={0}
            onNoteSelect={onNoteSelect}
            onCreateNote={onCreateNote}
            onCreateFolder={onCreateFolder}
            onDeleteNote={onDeleteNote}
            selectedNoteId={selectedNoteId}
            children={node.children || []}
          />
        ))}
      </div>
    </div>
  )
}
