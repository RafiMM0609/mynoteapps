'use client'

import { useState } from 'react'
import BlockBasedEditor from '../../components/BlockBasedEditor'
import type { Note } from '../../lib/supabase'

// Demo note for testing
const demoNote: Note = {
  id: 'demo-1',
  title: 'Advanced Editor Demo',
  content: `# Welcome to the Advanced Block-Based Editor

This is a demonstration of the new **Tiptap-powered editor** with full Markdown support and WYSIWYG capabilities.

## Features

### Text Formatting
- **Bold text** and *italic text*
- ~~Strikethrough~~ and \`inline code\`
- ==Highlighted text== and <u>underlined text</u>

### Lists
1. Numbered lists work great
2. With multiple items
3. And proper nesting

- Bullet lists too
- Simple and clean
- Easy to read

### Task Lists
- [ ] Uncompleted task
- [x] Completed task
- [ ] Another task to do

### Code Blocks
\`\`\`javascript
function hello() {
  console.log("Hello from the editor!");
}
\`\`\`

### Blockquotes
> This is a blockquote
> With multiple lines
> And proper formatting

### Tables
| Feature | Status | Notes |
|---------|--------|-------|
| WYSIWYG | ✅ | Full support |
| Markdown | ✅ | Two-way sync |
| Tables | ✅ | Resizable |

Try typing \`/\` to see the slash commands menu!`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: 'demo-user',
  parent_id: null,
  is_folder: false,
  sort_order: 0
}

export default function EditorDemo() {
  const [note, setNote] = useState<Note>(demoNote)

  const handleSave = async (noteId: string, title: string, content: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setNote(prev => ({
      ...prev,
      title,
      content,
      updated_at: new Date().toISOString()
    }))
    
    console.log('Note saved:', { noteId, title, content })
  }

  const handleCancel = () => {
    console.log('Edit cancelled')
    // In a real app, this would navigate back
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white min-h-screen shadow-lg">
          <BlockBasedEditor
            note={note}
            onSave={handleSave}
            onCancel={handleCancel}
            className="h-screen"
          />
        </div>
      </div>
    </div>
  )
}
