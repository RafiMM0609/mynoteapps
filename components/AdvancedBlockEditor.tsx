'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import CodeBlock from '@tiptap/extension-code-block'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Focus from '@tiptap/extension-focus'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
import { useState, useEffect, useCallback, useRef } from 'react'
import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'
import SimpleToolbar from './SimpleToolbar'
import SlashCommandExtension from './extensions/SlashCommand'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'
import { Bars3Icon, PlusIcon } from '@heroicons/react/24/outline'
import type { Note } from '../lib/supabase'

// Enhanced block structure with more metadata
export interface EditorBlock {
  id: string
  type: 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote' | 'codeBlock' | 'table' | 'image' | 'horizontalRule'
  content: any
  metadata: {
    timestamp: number
    author?: string
    version: number
    position: number
    tags?: string[]
    collaborators?: string[]
  }
}

interface BlockProps {
  block: EditorBlock
  isSelected: boolean
  onSelect: (id: string) => void
  onUpdate: (id: string, content: any) => void
  onDelete: (id: string) => void
  isMobile?: boolean
}

function SortableBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isMobile = false
}: BlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Simple block editor for each block type
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: `Type content for ${block.type}...`
      }),
      SlashCommandExtension,
      TaskList,
      TaskItem,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Link,
      CodeBlock,
      Underline,
      TextStyle,
      Color,
      Highlight,
      Typography,
      Focus,
      Dropcursor,
      Gapcursor
    ],
    content: block.content || '<p></p>',
    onUpdate: ({ editor }) => {
      onUpdate(block.id, editor.getHTML())
    },
    onFocus: () => {
      onSelect(block.id)
    }
  })


  useEffect(() => {
  if (!editor) return

  const handleKeyDown = (e: KeyboardEvent) => {
    if (
        e.key === 'Backspace' &&
        editor.isFocused &&
        (editor.getText().trim().length === 0 || editor.getHTML().replace(/<[^>]+>/g, '').trim().length === 0)
      ) {
        e.preventDefault()
        onDelete(block.id)
      }
    }

    const dom = editor.view.dom
    dom.addEventListener('keydown', handleKeyDown)
    return () => dom.removeEventListener('keydown', handleKeyDown)
  }, [editor, block.id, onDelete])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`block-editor-item group relative mb-0 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'z-50' : ''}`}
    >
      {/* Mobile-friendly Block Header with Drag Handle */}
      {/* <div className={`flex items-center mb-2 transition-opacity ${
        isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          {...attributes}
          {...listeners}
          className="p-2 lg:p-1 text-gray-400 hover:text-gray-600 active:text-gray-800 cursor-move mr-2 touch-manipulation bg-gray-50 hover:bg-gray-100 rounded"
          aria-label="Drag to reorder"
        >
          <Bars3Icon className="w-5 h-5 lg:w-4 lg:h-4" />
        </button>
        
        <div className="flex-1 text-xs text-gray-500 truncate">
          <span className="capitalize font-medium">{block.type.replace(/([A-Z])/g, ' $1')}</span>
          <span className="hidden sm:inline text-gray-400"> • {new Date(block.metadata.timestamp).toLocaleTimeString()}</span>
        </div>
        
        <button
          onClick={() => onDelete(block.id)}
          className="p-2 lg:p-1 text-red-400 hover:text-red-600 active:text-red-700 touch-manipulation bg-red-50 hover:bg-red-100 rounded"
          aria-label="Delete block"
        >
          <span className="text-lg lg:text-base font-bold">×</span>
        </button>
      </div> */}

      {/* Mobile-optimized Block Content */}
      <div className="block-content block-editor-prose prose-sm lg:prose max-w-none">
        <EditorContent editor={editor} />
      </div>

      {/* Block Metadata */}
      {block.metadata.tags && block.metadata.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {block.metadata.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface AdvancedBlockEditorProps {
  note: Note
  onSave: (noteId: string, title: string, content: string) => void
  onCancel: () => void
  className?: string
  availableNotes?: Note[]
  onNoteClick?: (note: Note) => void
  onCreateNewNote?: (title: string) => void
}

export default function AdvancedBlockEditor({
  note,
  onSave,
  onCancel,
  className = '',
  availableNotes = [],
  onNoteClick,
  onCreateNewNote
}: AdvancedBlockEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [blocks, setBlocks] = useState<EditorBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Enhanced mobile device detection with viewport info
  const [isMobile, setIsMobile] = useState(false)
  const [viewportHeight, setViewportHeight] = useState('100vh')

  // Initialize markdown parser and turndown service
  const markdownParser = useRef<MarkdownIt>()
  const turndownService = useRef<TurndownService>()

  // Initialize parsers
  useEffect(() => {
    markdownParser.current = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true
    })
    
    turndownService.current = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    })
  }, [])

  // Convert blocks to markdown
  const blocksToMarkdown = useCallback((): string => {
    if (!turndownService.current) return ''
    
    return blocks
      .map(block => {
        try {
          return turndownService.current!.turndown(block.content || '')
        } catch (error) {
          console.error('Error converting block to markdown:', error)
          return block.content || ''
        }
      })
      .join('\n\n')
  }, [blocks])

  // Convert markdown to blocks (simplified)
  const markdownToBlocks = useCallback((markdown: string): EditorBlock[] => {
    if (!markdown.trim()) {
      return [{
        id: `block-${Date.now()}`,
        type: 'paragraph',
        content: '<p></p>',
        metadata: {
          timestamp: Date.now(),
          version: 1,
          position: 0
        }
      }]
    }

    // Simple block parsing - split by double newlines
    const sections = markdown.split('\n\n').filter(Boolean)
    
    return sections.map((section, index) => {
      const id = `block-${Date.now()}-${index}`
      
      // Detect block type based on content
      let type: EditorBlock['type'] = 'paragraph'
      if (section.startsWith('#')) type = 'heading'
      else if (section.startsWith('- ') || section.startsWith('* ')) type = 'bulletList'
      else if (section.match(/^\d+\. /)) type = 'orderedList'
      else if (section.startsWith('> ')) type = 'blockquote'
      else if (section.startsWith('```')) type = 'codeBlock'
      else if (section.startsWith('- [ ]') || section.startsWith('- [x]')) type = 'taskList'

      // Convert markdown to HTML for content
      let content = '<p></p>'
      if (markdownParser.current) {
        try {
          content = markdownParser.current.render(section)
        } catch (error) {
          console.error('Error parsing markdown section:', error)
          content = `<p>${section}</p>`
        }
      }

      return {
        id,
        type,
        content,
        metadata: {
          timestamp: Date.now(),
          version: 1,
          position: index
        }
      }
    })
  }, [])

  // Initialize blocks from note content
  useEffect(() => {
    const initialBlocks = markdownToBlocks(note.content || '')
    setBlocks(initialBlocks)
  }, [note.content, markdownToBlocks])

  // Enhanced drag and drop sensors with mobile support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setBlocks((blocks) => {
        const oldIndex = blocks.findIndex(block => block.id === active.id)
        const newIndex = blocks.findIndex(block => block.id === over.id)
        
        const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex)
        
        // Update positions
        const updatedBlocks = reorderedBlocks.map((block, index) => ({
          ...block,
          metadata: {
            ...block.metadata,
            position: index,
            version: block.metadata.version + 1,
            timestamp: Date.now()
          }
        }))
        
        setHasChanges(true)
        return updatedBlocks
      })
    }
  }

  // Add new block
  const addBlock = (type: EditorBlock['type'] = 'paragraph') => {
    const newBlock: EditorBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '<p></p>',
      metadata: {
        timestamp: Date.now(),
        version: 1,
        position: blocks.length
      }
    }

    setBlocks(prev => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
    setHasChanges(true)
  }

  // Update block content
  const updateBlock = (blockId: string, content: any) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? {
            ...block,
            content,
            metadata: {
              ...block.metadata,
              version: block.metadata.version + 1,
              timestamp: Date.now()
            }
          }
        : block
    ))
    setHasChanges(true)
  }

  // Delete block
  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId))
    setHasChanges(true)
  }

  // Save note
  const handleSave = async () => {
    if (!hasChanges) return

    setIsSaving(true)
    try {
      const markdownContent = blocksToMarkdown()
      await onSave(note.id, title, markdownContent)
      setHasChanges(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        addBlock()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`advanced-block-editor h-full flex flex-col ${className}`}>
      {/* Mobile-friendly Header */}
      <div className="flex-shrink-0 px-3 lg:px-6 py-3 lg:py-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setHasChanges(true)
            }}
            className="flex-1 text-lg lg:text-xl font-semibold bg-transparent border-none outline-none placeholder-gray-400"
            placeholder="Untitled Note"
          />

          {/* Mobile Actions Row */}
          <div className="flex items-center justify-between lg:justify-end space-x-2">
            {saveSuccess && (
              <span className="text-sm text-green-600">Saved!</span>
            )}
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => addBlock()}
                className="inline-flex items-center px-2 lg:px-3 py-1.5 border border-gray-300 shadow-sm text-xs lg:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
              >
                <PlusIcon className="w-4 h-4 lg:mr-1" />
                <span className="hidden sm:inline">Add Block</span>
              </button>

              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="inline-flex items-center px-3 lg:px-4 py-1.5 lg:py-2 border border-transparent text-xs lg:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>

              <button
                onClick={onCancel}
                className="inline-flex items-center px-3 lg:px-4 py-1.5 lg:py-2 border border-gray-300 shadow-sm text-xs lg:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs lg:text-sm text-gray-500">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          <span className="hidden sm:inline"> • Press Ctrl+Enter to add block</span>
          <span className="hidden lg:inline"> • Drag to reorder</span>
          <span className="sm:hidden"> • Tap + to add block</span>
        </div>
      </div>

      {/* Mobile-optimized Blocks Editor */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-6 -webkit-overflow-scrolling-touch" style={{ minHeight: isMobile ? viewportHeight : 'auto' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0 lg:space-y-0">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={setSelectedBlockId}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {blocks.length === 0 && (
          <div className="text-center py-8 lg:py-12">
            <div className="text-gray-500 mb-4">No blocks yet</div>
            <button
              onClick={() => addBlock()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Your First Block
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
