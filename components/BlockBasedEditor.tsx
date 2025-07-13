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
import type { Note } from '../lib/supabase'

// Block types for the editor
export interface EditorBlock {
  id: string
  type: string
  content: any
  metadata?: {
    timestamp?: number
    author?: string
    version?: number
  }
}

interface BlockBasedEditorProps {
  note: Note
  onSave: (noteId: string, title: string, content: string) => void
  onCancel: () => void
  className?: string
}

export default function BlockBasedEditor({
  note,
  onSave,
  onCancel,
  className = ''
}: BlockBasedEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [markdownContent, setMarkdownContent] = useState(note.content || '')
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const debounceRef = useRef<NodeJS.Timeout>()
  const isUpdatingFromMarkdown = useRef(false)
  const isUpdatingFromEditor = useRef(false)
  
  // Initialize markdown parser and turndown service
  const markdownParser = useRef<MarkdownIt>()
  const turndownService = useRef<TurndownService>()

  // Convert markdown to HTML
  const markdownToHtml = useCallback((markdown: string): string => {
    if (!markdownParser.current || !markdown.trim()) return '<p></p>'
    
    try {
      return markdownParser.current.render(markdown)
    } catch (error) {
      console.error('Error converting markdown to HTML:', error)
      return `<p>${markdown}</p>`
    }
  }, [])

  // Convert HTML to markdown
  const htmlToMarkdown = useCallback((html: string): string => {
    if (!turndownService.current || !html.trim()) return ''
    
    try {
      return turndownService.current.turndown(html)
    } catch (error) {
      console.error('Error converting HTML to markdown:', error)
      return html
    }
  }, [])
  
  useEffect(() => {
    // Initialize markdown-it
    markdownParser.current = new MarkdownIt({
      html: true,
      breaks: false,
      linkify: true
    })
    
    // Initialize turndown service
    turndownService.current = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    })
    
    // Add custom turndown rules
    turndownService.current.addRule('strikethrough', {
      filter: ['del', 's'],
      replacement: (content) => `~~${content}~~`
    })
    
    turndownService.current.addRule('highlight', {
      filter: 'mark',
      replacement: (content) => `==${content}==`
    })
    
    turndownService.current.addRule('underline', {
      filter: 'u',
      replacement: (content) => `<u>${content}</u>`
    })
  }, [])

  // Configure Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false // We'll use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }
          return 'Type "/" for commands or start writing...'
        }
      }),
      SlashCommandExtension,
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline'
        }
      }),
      CodeBlock,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true
      }),
      Typography,
      Focus.configure({
        className: 'has-focus',
        mode: 'all'
      }),
      Dropcursor,
      Gapcursor
    ],
    content: markdownToHtml(markdownContent),
    onUpdate: ({ editor }) => {
      if (!isUpdatingFromMarkdown.current) {
        isUpdatingFromEditor.current = true
        
        // Debounce the conversion to avoid too frequent updates
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        
        debounceRef.current = setTimeout(() => {
          const html = editor.getHTML()
          const markdown = htmlToMarkdown(html)
          setMarkdownContent(markdown)
          setHasChanges(true)
          isUpdatingFromEditor.current = false
        }, 300)
      }
    }
  })

  // Update editor when markdown changes externally
  useEffect(() => {
    if (editor && !isUpdatingFromEditor.current) {
      isUpdatingFromMarkdown.current = true
      const html = markdownToHtml(markdownContent)
      editor.commands.setContent(html)
      
      setTimeout(() => {
        isUpdatingFromMarkdown.current = false
      }, 100)
    }
  }, [markdownContent, editor, markdownToHtml])

  // Check for changes
  useEffect(() => {
    const hasContentChanges = markdownContent !== (note.content || '')
    const hasTitleChanges = title !== note.title
    setHasChanges(hasContentChanges || hasTitleChanges)
  }, [markdownContent, title, note.content, note.title])

  // Handle save
  const handleSave = async () => {
    if (!hasChanges || isSaving) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      await onSave(note.id, title, markdownContent)
      setSaveSuccess(true)
      setHasChanges(false)
      
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
      if (!confirmCancel) return
    }
    onCancel()
  }

  // Handle slash command selection
  const handleSlashCommand = (command: string) => {
    if (!editor) return
    
    const { from } = editor.state.selection
    const slashPos = editor.state.doc.textBetween(from - 10, from, '', ' ').lastIndexOf('/')
    
    if (slashPos !== -1) {
      const deleteFrom = from - (10 - slashPos)
      
      // Delete the slash and any text after it
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run()
      
      // Execute the command
      switch (command) {
        case 'heading1':
          editor.chain().focus().toggleHeading({ level: 1 }).run()
          break
        case 'heading2':
          editor.chain().focus().toggleHeading({ level: 2 }).run()
          break
        case 'heading3':
          editor.chain().focus().toggleHeading({ level: 3 }).run()
          break
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run()
          break
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run()
          break
        case 'taskList':
          editor.chain().focus().toggleTaskList().run()
          break
        case 'blockquote':
          editor.chain().focus().toggleBlockquote().run()
          break
        case 'codeBlock':
          editor.chain().focus().toggleCodeBlock().run()
          break
        case 'table':
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          break
        case 'horizontalRule':
          editor.chain().focus().setHorizontalRule().run()
          break
        default:
          break
      }
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`block-based-editor h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 border-none focus:outline-none bg-transparent placeholder-gray-400"
              placeholder="Untitled"
            />
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  hasChanges ? 'bg-orange-400 animate-pulse' : 'bg-green-400'
                }`}></div>
                <span>{hasChanges ? 'Unsaved changes' : 'All changes saved'}</span>
              </div>
              
              {/* Mode Toggle */}
              <button
                onClick={() => setIsMarkdownMode(!isMarkdownMode)}
                className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {isMarkdownMode ? '👁️ WYSIWYG' : '📝 Markdown'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                !hasChanges 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : saveSuccess 
                    ? 'bg-green-500 focus:ring-green-500' 
                    : isSaving 
                      ? 'bg-blue-400 cursor-wait' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {isMarkdownMode ? (
          /* Markdown Mode */
          <div className="h-full p-6">
            <textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              className="w-full h-full resize-none border border-gray-300 rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your markdown here..."
            />
          </div>
        ) : (
          /* WYSIWYG Mode */
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            {editor && (
              <SimpleToolbar editor={editor} />
            )}
            
            {/* Editor */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <EditorContent 
                  editor={editor}
                  className="prose prose-lg max-w-none focus:outline-none min-h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
