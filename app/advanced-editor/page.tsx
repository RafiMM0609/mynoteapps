'use client'

import { useState } from 'react'
import AdvancedBlockEditor from '../../components/AdvancedBlockEditor'
import type { Note } from '../../lib/supabase'

export default function AdvancedEditorDemo() {
  const [currentNote, setCurrentNote] = useState<Note>({
    id: 'demo-advanced',
    title: 'Advanced Block Editor Demo',
    content: `# Welcome to Advanced Block Editor

This is a **block-based editor** with enhanced features:

- Drag and drop block reordering
- Individual block editing
- Block metadata and versioning
- Real-time collaboration ready
- Enhanced slash commands

## Features

### Block Types
- Paragraphs
- Headings (H1, H2, H3)
- Lists (bullet, numbered, tasks)
- Blockquotes
- Code blocks
- Tables
- Images
- Horizontal rules

### Block Operations
1. **Drag to reorder** - Use the drag handle to reorder blocks
2. **Individual editing** - Each block is independently editable
3. **Block metadata** - Version tracking, timestamps, and more
4. **Delete blocks** - Remove unwanted blocks easily

### Keyboard Shortcuts
- **Ctrl+S** - Save note
- **Ctrl+Enter** - Add new block
- **/** - Open slash command menu

## Task List Example

- [x] Create block-based editor
- [x] Add drag and drop functionality
- [x] Implement slash commands
- [ ] Add collaborative editing
- [ ] Add export functionality

> This is a blockquote example. You can use it for quotes, callouts, or important information.

## Code Example

\`\`\`javascript
function createBlock(type, content) {
  return {
    id: generateId(),
    type,
    content,
    metadata: {
      timestamp: Date.now(),
      version: 1,
      position: getNextPosition()
    }
  }
}
\`\`\`

Try typing **/** to see the slash command menu in action!`,
    user_id: 'demo-user',
    parent_id: null,
    is_folder: false,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  const handleSave = async (noteId: string, title: string, content: string) => {
    // Simulate save operation
    console.log('Saving advanced note:', { noteId, title, content })
    
    setCurrentNote(prev => ({
      ...prev,
      title,
      content,
      updated_at: new Date().toISOString()
    }))

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const handleCancel = () => {
    console.log('Cancelled editing')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-friendly Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 lg:py-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">
                Advanced Block Editor
              </h1>
              <p className="hidden sm:block text-sm text-gray-600 mt-1">
                Next-generation block-based editor with drag & drop
              </p>
              {/* Mobile subtitle */}
              <p className="sm:hidden text-xs text-gray-600 mt-1">
                Block-based editor
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center px-3 py-2 lg:px-4 border border-gray-300 shadow-sm text-xs lg:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-3"
            >
              <span className="hidden sm:inline">← Back to Home</span>
              <span className="sm:hidden">← Home</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Editor Container */}
      <div className="max-w-7xl mx-auto px-0 lg:px-4">
        <div className="bg-white shadow-sm lg:rounded-lg lg:mt-4">
          <AdvancedBlockEditor
            note={currentNote}
            onSave={handleSave}
            onCancel={handleCancel}
            className="min-h-[calc(100vh-140px)] lg:min-h-[calc(100vh-120px)]"
          />
        </div>
      </div>

      {/* Mobile-friendly Info Panel */}
      <div className="fixed bottom-4 right-4 max-w-xs lg:max-w-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4 shadow-lg">
          <h3 className="text-xs lg:text-sm font-medium text-blue-900 mb-2">
            💡 Tips
          </h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li className="hidden lg:block">• Hover over blocks to see controls</li>
            <li className="lg:hidden">• Tap blocks to see controls</li>
            <li className="hidden lg:block">• Drag the ≡ icon to reorder blocks</li>
            <li className="lg:hidden">• Long press ≡ to reorder blocks</li>
            <li>• Type "/" for slash commands</li>
            <li className="hidden sm:block">• Ctrl+Enter to add new block</li>
            <li>• Each block is independently editable</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
