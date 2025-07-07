'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bars3Icon,
  Bars2Icon,
  ListBulletIcon,
  NumberedListIcon,
  TableCellsIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  MinusIcon,
  PhotoIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline'
import type { Editor } from '@tiptap/react'

export interface SlashCommandItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  keywords: string[]
  action: (editor: Editor) => void
}

interface SlashCommandsListProps {
  query: string
  onSelect: (item: SlashCommandItem) => void
  onEscape: () => void
  editor: Editor
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: 'heading1',
    title: 'Heading 1',
    description: 'Big section heading',
    icon: ({ className }) => <span className={`${className} font-bold text-lg`}>H1</span>,
    keywords: ['h1', 'heading', 'title', 'big'],
    action: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    }
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: ({ className }) => <span className={`${className} font-bold`}>H2</span>,
    keywords: ['h2', 'heading', 'subtitle', 'medium'],
    action: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    }
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    description: 'Small section heading',
    icon: ({ className }) => <span className={`${className} font-semibold text-sm`}>H3</span>,
    keywords: ['h3', 'heading', 'small'],
    action: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    }
  },
  {
    id: 'paragraph',
    title: 'Text',
    description: 'Just start writing with plain text',
    icon: ({ className }) => <span className={`${className}`}>¶</span>,
    keywords: ['paragraph', 'text', 'plain'],
    action: (editor) => {
      editor.chain().focus().setParagraph().run()
    }
  },
  {
    id: 'bulletList',
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: ListBulletIcon,
    keywords: ['bullet', 'list', 'unordered', 'ul'],
    action: (editor) => {
      editor.chain().focus().toggleBulletList().run()
    }
  },
  {
    id: 'orderedList',
    title: 'Numbered List',
    description: 'Create a list with numbering',
    icon: NumberedListIcon,
    keywords: ['numbered', 'list', 'ordered', 'ol'],
    action: (editor) => {
      editor.chain().focus().toggleOrderedList().run()
    }
  },
  {
    id: 'taskList',
    title: 'Task List',
    description: 'Track tasks with a checklist',
    icon: Square3Stack3DIcon,
    keywords: ['task', 'todo', 'checkbox', 'checklist'],
    action: (editor) => {
      editor.chain().focus().toggleTaskList().run()
    }
  },
  {
    id: 'blockquote',
    title: 'Quote',
    description: 'Capture a quote',
    icon: ChatBubbleLeftRightIcon,
    keywords: ['quote', 'blockquote', 'citation'],
    action: (editor) => {
      editor.chain().focus().toggleBlockquote().run()
    }
  },
  {
    id: 'codeBlock',
    title: 'Code Block',
    description: 'Capture a code snippet',
    icon: CodeBracketIcon,
    keywords: ['code', 'codeblock', 'snippet', 'programming'],
    action: (editor) => {
      editor.chain().focus().toggleCodeBlock().run()
    }
  },
  {
    id: 'horizontalRule',
    title: 'Divider',
    description: 'Visually divide blocks',
    icon: MinusIcon,
    keywords: ['divider', 'horizontal', 'rule', 'line', 'hr'],
    action: (editor) => {
      editor.chain().focus().setHorizontalRule().run()
    }
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Insert a table',
    icon: TableCellsIcon,
    keywords: ['table', 'grid', 'rows', 'columns'],
    action: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Upload or embed with a link',
    icon: PhotoIcon,
    keywords: ['image', 'picture', 'photo', 'embed'],
    action: (editor) => {
      const url = window.prompt('Enter image URL')
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    }
  }
]

export default function SlashCommandsList({
  query,
  onSelect,
  onEscape,
  editor
}: SlashCommandsListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter commands based on query
  const filteredCommands = SLASH_COMMANDS.filter(command => {
    if (!query) return true
    const searchTerms = query.toLowerCase()
    return (
      command.title.toLowerCase().includes(searchTerms) ||
      command.description.toLowerCase().includes(searchTerms) ||
      command.keywords.some(keyword => keyword.includes(searchTerms))
    )
  })

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1))
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredCommands[selectedIndex]) {
        onSelect(filteredCommands[selectedIndex])
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
    }
  }, [filteredCommands, selectedIndex, onSelect, onEscape])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (filteredCommands.length === 0) {
    return (
      <div className="slash-commands-menu">
        <div className="px-3 py-2 text-sm text-gray-500">
          No commands found for "{query}"
        </div>
      </div>
    )
  }

  return (
    <div className="slash-commands-menu">
      {filteredCommands.map((command, index) => {
        const Icon = command.icon
        return (
          <button
            key={command.id}
            className={`w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center space-x-3 ${
              index === selectedIndex ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelect(command)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-100">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {command.title}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {command.description}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
