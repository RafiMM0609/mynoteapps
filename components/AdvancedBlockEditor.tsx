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
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

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
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**'
    })
  }, [])

  // Convert markdown to HTML
  const markdownToHtml = useCallback((markdown: string): string => {
    if (!markdown.trim() || !markdownParser.current) {
      return '<p></p>'
    }
    
    try {
      return markdownParser.current.render(markdown)
    } catch (error) {
      console.error('Error parsing markdown:', error)
      return `<p>${markdown}</p>`
    }
  }, [])

  // Convert HTML to markdown
  const htmlToMarkdown = useCallback((html: string): string => {
    if (!html.trim() || !turndownService.current) {
      return ''
    }
    
    try {
      return turndownService.current.turndown(html)
    } catch (error) {
      console.error('Error converting to markdown:', error)
      return html
    }
  }, [])

  // Initialize editor with note content
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note...'
      }),
      SlashCommandExtension,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Link.configure({
        openOnClick: false,
      }),
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
    content: markdownToHtml(note.content || ''),
    onUpdate: ({ editor }) => {
      setHasChanges(true)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none max-w-none',
      },
    },
  })

  // Save note
  const handleSave = async () => {
    if (!hasChanges || !editor) return

    setIsSaving(true)
    try {
      const htmlContent = editor.getHTML()
      const markdownContent = htmlToMarkdown(htmlContent)
      
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

  // Update editor content when note changes
  useEffect(() => {
    if (editor && note.content !== undefined) {
      const htmlContent = markdownToHtml(note.content || '')
      editor.commands.setContent(htmlContent)
      setHasChanges(false)
    }
  }, [note.content, editor, markdownToHtml])

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
    <div className={`advanced-block-editor h-full flex flex-col ${className}`}>
      {/* Header */}
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

          {/* Actions */}
          <div className="flex items-center justify-between lg:justify-end space-x-2">
            {saveSuccess && (
              <span className="text-sm text-green-600">Saved!</span>
            )}
            
            <div className="flex items-center space-x-2">
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
          Press Ctrl+S to save • Use markdown syntax <span className="hidden lg:inline">or toolbar</span> for formatting
        </div>
      </div>

      {/* Toolbar - Hidden on mobile */}
      {editor && (
        <div className="hidden lg:block flex-shrink-0 border-b border-gray-200 bg-white">
          <SimpleToolbar editor={editor} />
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-6 -webkit-overflow-scrolling-touch">
        <div className="max-w-none">
          <EditorContent 
            editor={editor} 
            className="min-h-full focus-within:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
