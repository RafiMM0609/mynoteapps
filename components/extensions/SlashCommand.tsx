'use client'

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import tippy, { Instance, Props } from 'tippy.js'
import React, { useState, useEffect } from 'react'
import {
  Bars3Icon,
  ListBulletIcon,
  NumberedListIcon,
  TableCellsIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  MinusIcon,
  PhotoIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline'

export interface SlashCommandItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  keywords: string[]
  action: (editor: Editor) => void
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: 'heading1',
    title: 'Heading 1',
    description: 'Big section heading',
    icon: ({ className }) => <span className={`${className} font-bold text-lg`}>H1</span>,
    keywords: ['h1', 'heading', 'title', 'big'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: ({ className }) => <span className={`${className} font-bold`}>H2</span>,
    keywords: ['h2', 'heading', 'subtitle', 'medium'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    description: 'Small section heading',
    icon: ({ className }) => <span className={`${className} font-semibold text-sm`}>H3</span>,
    keywords: ['h3', 'heading', 'small'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    id: 'bulletList',
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: ListBulletIcon,
    keywords: ['bullet', 'list', 'unordered', 'ul'],
    action: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    id: 'orderedList',
    title: 'Numbered List',
    description: 'Create a list with numbering',
    icon: NumberedListIcon,
    keywords: ['numbered', 'list', 'ordered', 'ol'],
    action: (editor) => editor.chain().focus().toggleOrderedList().run()
  },
  {
    id: 'taskList',
    title: 'Task List',
    description: 'Track tasks with a checklist',
    icon: Square3Stack3DIcon,
    keywords: ['task', 'todo', 'checkbox', 'checklist'],
    action: (editor) => editor.chain().focus().toggleTaskList().run()
  },
  {
    id: 'blockquote',
    title: 'Quote',
    description: 'Capture a quote',
    icon: ChatBubbleLeftRightIcon,
    keywords: ['quote', 'blockquote', 'citation'],
    action: (editor) => editor.chain().focus().toggleBlockquote().run()
  },
  {
    id: 'codeBlock',
    title: 'Code Block',
    description: 'Capture a code snippet',
    icon: CodeBracketIcon,
    keywords: ['code', 'codeblock', 'snippet', 'programming'],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run()
  },
  {
    id: 'horizontalRule',
    title: 'Divider',
    description: 'Visually divide blocks',
    icon: MinusIcon,
    keywords: ['divider', 'horizontal', 'rule', 'line', 'hr'],
    action: (editor) => editor.chain().focus().setHorizontalRule().run()
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Insert a table',
    icon: TableCellsIcon,
    keywords: ['table', 'grid', 'rows', 'columns'],
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
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

interface SlashCommandMenuProps {
  query: string
  onSelect: (item: SlashCommandItem) => void
  onEscape: () => void
  editor: Editor
}

const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ 
  query, 
  onSelect, 
  onEscape, 
  editor 
}) => {
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
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filteredCommands, selectedIndex, onSelect, onEscape])

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

interface SlashCommandState {
  query: string
  range: { from: number; to: number } | null
}

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('slashCommand')
    let popup: Instance<Props>[] | null = null
    let component: ReactRenderer | null = null

    const hideMenu = () => {
      if (popup) {
        popup.forEach(instance => instance.destroy())
        popup = null
      }
      if (component) {
        component.destroy()
        component = null
      }
    }

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init(): SlashCommandState {
            return {
              query: '',
              range: null
            }
          },
          apply(tr, oldState, oldDoc, newState): SlashCommandState {
            const { selection, doc } = newState
            const { from } = selection

            // Get text before cursor
            const $from = doc.resolve(from)
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 20),
              $from.parentOffset,
              null,
              '\ufffc'
            )

            // Check for slash command
            const match = textBefore.match(/\/([a-zA-Z0-9]*)?$/)

            if (match && $from.parent.type.name === 'paragraph') {
              const query = match[1] || ''
              const range = {
                from: from - match[0].length,
                to: from
              }

              return {
                query,
                range
              }
            }

            return {
              query: '',
              range: null
            }
          }
        },
        view: () => ({
          update: (view, prevState) => {
            const state = pluginKey.getState(view.state)
            const prevPluginState = pluginKey.getState(prevState)

            if (state?.range && state.query !== undefined) {
              // Show menu
              if (!component) {
                component = new ReactRenderer(SlashCommandMenu, {
                  props: {
                    query: state.query,
                    onSelect: (item: SlashCommandItem) => {
                      if (state.range) {
                        // Remove the slash command text
                        const tr = view.state.tr
                        tr.delete(state.range.from, state.range.to)
                        
                        // Apply the transaction first
                        view.dispatch(tr)
                        
                        // Then execute the command
                        setTimeout(() => {
                          item.action(this.editor)
                        }, 0)
                      }
                      hideMenu()
                    },
                    onEscape: () => {
                      hideMenu()
                    },
                    editor: this.editor
                  },
                  editor: this.editor,
                })

                popup = tippy('body', {
                  getReferenceClientRect: () => {
                    const { from } = view.state.selection
                    const start = view.coordsAtPos(from)
                    return new DOMRect(start.left, start.top, 0, 0)
                  },
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                  theme: 'light',
                  maxWidth: 320,
                  offset: [0, 8],
                })
              } else if (state.query !== prevPluginState?.query) {
                // Update query
                component.updateProps({ query: state.query })
              }
            } else {
              // Hide menu
              hideMenu()
            }
          },
          destroy: () => {
            hideMenu()
          }
        })
      })
    ]
  }
})

export default SlashCommandExtension
