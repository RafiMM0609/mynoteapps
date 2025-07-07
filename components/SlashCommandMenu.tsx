'use client'

import { useState, useEffect, useRef } from 'react'
import {
  DocumentTextIcon,
  Bars3Icon,
  Bars2Icon,
  ListBulletIcon,
  NumberedListIcon,
  TableCellsIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  MinusIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface SlashCommand {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  keywords: string[]
}

interface SlashCommandMenuProps {
  position: { x: number; y: number }
  onSelect: (commandId: string) => void
  onClose: () => void
  searchQuery?: string
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'heading1',
    title: 'Heading 1',
    description: 'Big section heading',
    icon: ({ className }) => <span className={className}>H1</span>,
    keywords: ['h1', 'heading', 'title', 'big']
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: ({ className }) => <span className={className}>H2</span>,
    keywords: ['h2', 'heading', 'subtitle', 'medium']
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    description: 'Small section heading',
    icon: ({ className }) => <span className={className}>H3</span>,
    keywords: ['h3', 'heading', 'small']
  },
  {
    id: 'bulletList',
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: ListBulletIcon,
    keywords: ['bullet', 'list', 'ul', 'unordered']
  },
  {
    id: 'orderedList',
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: NumberedListIcon,
    keywords: ['numbered', 'list', 'ol', 'ordered', '1', '2', '3']
  },
  {
    id: 'taskList',
    title: 'Task List',
    description: 'Create a task list with checkboxes',
    icon: ({ className }) => <span className={className}>☑️</span>,
    keywords: ['task', 'todo', 'checkbox', 'check']
  },
  {
    id: 'blockquote',
    title: 'Quote',
    description: 'Capture a quote',
    icon: ChatBubbleLeftRightIcon,
    keywords: ['quote', 'blockquote', 'citation']
  },
  {
    id: 'codeBlock',
    title: 'Code Block',
    description: 'Capture a code snippet',
    icon: CodeBracketIcon,
    keywords: ['code', 'snippet', 'programming', 'syntax']
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Insert a table',
    icon: TableCellsIcon,
    keywords: ['table', 'grid', 'data', 'rows', 'columns']
  },
  {
    id: 'horizontalRule',
    title: 'Divider',
    description: 'Visually divide blocks',
    icon: MinusIcon,
    keywords: ['divider', 'separator', 'hr', 'horizontal', 'rule']
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Upload or embed with a link',
    icon: PhotoIcon,
    keywords: ['image', 'picture', 'photo', 'upload', 'embed']
  }
]

export default function SlashCommandMenu({
  position,
  onSelect,
  onClose,
  searchQuery = ''
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Filter commands based on search query
  const filteredCommands = SLASH_COMMANDS.filter(command => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      command.title.toLowerCase().includes(query) ||
      command.description.toLowerCase().includes(query) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(query))
    )
  })

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].id)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, filteredCommands, onSelect, onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (filteredCommands.length === 0) {
    return null
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[280px] max-w-[320px]"
      style={{
        left: position.x,
        top: position.y,
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      <div className="py-2">
        {filteredCommands.map((command, index) => {
          const Icon = command.icon
          return (
            <button
              key={command.id}
              onClick={() => onSelect(command.id)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                index === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex-shrink-0">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  {command.title}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {command.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      {searchQuery && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''} found
        </div>
      )}
      
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}
