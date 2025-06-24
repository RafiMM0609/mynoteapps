'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  BoldIcon, 
  ItalicIcon, 
  ListBulletIcon, 
  CodeBracketIcon,
  HashtagIcon,
  LinkIcon,
  TableCellsIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  PhotoIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface SlashCommand {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => { before: string; after: string }
}

interface SlashCommandDropdownProps {
  isVisible: boolean
  position: { top: number; left: number }
  onSelect: (command: SlashCommand) => void
  onClose: () => void
  searchQuery: string
}

const allCommands: SlashCommand[] = [
    {
      id: 'heading1',
      label: 'Heading 1',
      description: 'Large section heading',
      icon: HashtagIcon,
      shortcut: 'H1',
      action: () => ({ before: '# ', after: '' })
    },
    {
      id: 'heading2',
      label: 'Heading 2',
      description: 'Medium section heading',
      icon: HashtagIcon,
      shortcut: 'H2',
      action: () => ({ before: '## ', after: '' })
    },
    {
      id: 'heading3',
      label: 'Heading 3',
      description: 'Small section heading',
      icon: HashtagIcon,
      shortcut: 'H3',
      action: () => ({ before: '### ', after: '' })
    },
    {
      id: 'bold',
      label: 'Bold',
      description: 'Make text bold',
      icon: BoldIcon,
      shortcut: 'Ctrl+B',
      action: () => ({ before: '**', after: '**' })
    },
    {
      id: 'italic',
      label: 'Italic',
      description: 'Make text italic',
      icon: ItalicIcon,
      shortcut: 'Ctrl+I',
      action: () => ({ before: '*', after: '*' })
    },    {
      id: 'bulletlist',
      label: 'Bullet List',
      description: 'Create a modern bulleted list',
      icon: ListBulletIcon,
      action: () => ({ before: '- ', after: '' })
    },
    {
      id: 'numberlist',
      label: 'Numbered List',
      description: 'Create a stylized numbered list',
      icon: ListBulletIcon,
      action: () => ({ before: '1. ', after: '' })
    },
    {
      id: 'checklist',
      label: 'Task List',
      description: 'Create an interactive checklist',
      icon: CheckIcon,
      action: () => ({ before: '- [ ] ', after: '' })
    },
    {
      id: 'code',
      label: 'Inline Code',
      description: 'Inline code formatting',
      icon: CodeBracketIcon,
      action: () => ({ before: '`', after: '`' })
    },
    {
      id: 'codeblock',
      label: 'Code Block',
      description: 'Multi-line code block',
      icon: CodeBracketIcon,
      action: () => ({ before: '```\n', after: '\n```' })
    },    {
      id: 'quote',
      label: 'Quote',
      description: 'Create a blockquote',
      icon: ChatBubbleLeftIcon,
      action: () => ({ before: '> ', after: '' })
    },    {
      id: 'link',
      label: 'Link',
      description: 'Insert a link',
      icon: LinkIcon,
      action: () => ({ before: '[', after: '](url)' })
    },
    {
      id: 'notelink',
      label: 'Note Link',
      description: 'Link to another note',
      icon: DocumentTextIcon,
      action: () => ({ before: '[[', after: ']]' })
    },
    {
      id: 'table',
      label: 'Table',
      description: 'Insert a table',
      icon: TableCellsIcon,
      action: () => ({ 
        before: '| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n', 
        after: '' 
      })
    },
    {
      id: 'checkbox',
      label: 'Checkbox',
      description: 'Create a task list item',
      icon: CheckIcon,
      action: () => ({ before: '- [ ] ', after: '' })
    },
    {
      id: 'image',
      label: 'Image',
      description: 'Insert an image',
      icon: PhotoIcon,
      action: () => ({ before: '![alt text](', after: ')' })
    },
    {
      id: 'divider',
      label: 'Divider',
      description: 'Insert a horizontal line',
      icon: () => <div className="w-4 h-0.5 bg-current" />,
      action: () => ({ before: '---\n', after: '' })
    }
  ]

export default function SlashCommandDropdown({ 
  isVisible, 
  position, 
  onSelect, 
  onClose, 
  searchQuery 
}: SlashCommandDropdownProps) {  const [selectedIndex, setSelectedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)  // Close slash dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isVisible && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Delay closing to allow button clicks to be processed first
        setTimeout(() => {
          onClose()
        }, 50)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVisible, onClose])

  // Filter commands based on search query
  const filteredCommands = useMemo(() => allCommands.filter(command =>
    command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.description.toLowerCase().includes(searchQuery.toLowerCase())
  ), [searchQuery])
  // Reset selected index when commands change
  useEffect(() => {
    if (filteredCommands.length > 0) {
      setSelectedIndex(0)
    } else {
      setSelectedIndex(-1) // No valid selection when no commands
    }
  }, [filteredCommands])// Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || filteredCommands.length === 0) return
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => {
            const maxIndex = filteredCommands.length - 1
            return prev >= maxIndex ? 0 : prev + 1
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => {
            const maxIndex = filteredCommands.length - 1
            return prev <= 0 ? maxIndex : prev - 1
          })
          break
        case 'Enter':
          e.preventDefault()
          const selectedCommand = filteredCommands[selectedIndex]
          if (selectedCommand && selectedIndex >= 0 && selectedIndex < filteredCommands.length) {
            onSelect(selectedCommand)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    const handleResize = () => {
      if (isVisible) {
        // Force recalculation of position on window resize
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible, selectedIndex, filteredCommands, onSelect, onClose])
  // Auto-scroll to selected item
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const commandItems = dropdownRef.current.querySelectorAll('button')
      const selectedElement = commandItems[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex])
  if (!isVisible || filteredCommands.length === 0) return null

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto min-w-80 slash-dropdown slash-dropdown-enter custom-scrollbar"
      style={{
        top: typeof window !== 'undefined' ? Math.max(10, Math.min(position.top, window.innerHeight - 320)) : position.top,
        left: typeof window !== 'undefined' ? Math.max(10, Math.min(position.left, window.innerWidth - 320)) : position.left,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <span className="font-medium">Slash Commands</span>
          <span className="ml-auto">↑↓ Navigate • Enter Select • Esc Close</span>
        </div>
      </div>

      {/* Commands list */}
      <div className="py-1">
        {filteredCommands.map((command, index) => {
          const Icon = command.icon
          return (            <button
                key={command.id}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Use setTimeout to ensure this runs after any outside click handlers
                  setTimeout(() => {
                    onSelect(command)
                  }, 0)
                }}
                className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150 ${
                  index === selectedIndex 
                    ? 'bg-blue-50 border-r-2 border-blue-500' 
                    : ''
                }`}
                type="button"
              ><div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150 ${
                    index === selectedIndex 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium transition-colors duration-150 ${
                        index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {command.label}
                      </h4>
                      {command.shortcut && (
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                          {command.shortcut}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 transition-colors duration-150 ${
                      index === selectedIndex ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {command.description}
                    </p>
                  </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer tip */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          💡 Tip: Type to search commands, or use keyboard shortcuts
        </p>
      </div>
    </div>
  )
}
