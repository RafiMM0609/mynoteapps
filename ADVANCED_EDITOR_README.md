# Advanced Block-Based Editor

## Overview

Sistem editor canggih yang mendukung pengeditan dua arah antara Markdown dan WYSIWYG, dibangun dengan Tiptap dan dirancang mirip seperti Notion atau Medium.

## Fitur-Fitur Utama

### 1. Pengeditan Dua Arah (Bidirectional Editing)
- **Markdown ⟷ WYSIWYG**: Sinkronisasi real-time antara mode Markdown dan WYSIWYG
- **Debouncing**: Konversi otomatis dengan delay 300ms untuk performa optimal
- **Context Preservation**: Mempertahankan posisi kursor saat switching mode

### 2. Editor WYSIWYG Berbasis Tiptap
- **Rich Text Formatting**: Bold, italic, underline, strikethrough, highlight
- **Block Elements**: Headings (H1-H6), paragraphs, blockquotes
- **Lists**: Bullet lists, numbered lists, task lists dengan checkbox
- **Code**: Inline code dan code blocks
- **Advanced**: Tables, images, links, horizontal rules

### 3. Struktur Berbasis Blok
- **Block-based Architecture**: Setiap elemen adalah blok independen
- **Extensible**: Mudah ditambahkan jenis blok baru
- **Metadata Support**: Setiap blok dapat memiliki metadata (timestamp, author, version)

### 4. Markdown Parsing
- **markdown-it**: Parser Markdown yang powerful dan extensible
- **GFM Support**: GitHub Flavored Markdown compatibility
- **Custom Extensions**: Dukungan untuk syntax khusus

### 5. UI/UX yang Responsif
- **Mobile-First**: Optimized untuk semua ukuran layar
- **Touch-Friendly**: Interface yang mudah digunakan di perangkat touch
- **Keyboard Shortcuts**: Shortcut lengkap untuk power users

## Komponen Utama

### 1. BlockBasedEditor.tsx
Komponen utama editor yang menggabungkan semua fitur:

```tsx
interface BlockBasedEditorProps {
  note: Note
  onSave: (noteId: string, title: string, content: string) => void
  onCancel: () => void
  className?: string
}
```

**Key Features:**
- Real-time bidirectional conversion
- Debounced updates untuk performa
- Auto-save integration
- Mode switching (Markdown/WYSIWYG)

### 2. SimpleToolbar.tsx
Toolbar dengan kontrol formatting dasar:

**Tools Available:**
- Text formatting (bold, italic, underline, strike, code)
- Headings (H1-H3)
- Lists (bullet, numbered)
- Blocks (blockquote, code block)
- Undo/Redo

### 3. Styling (tiptap.css)
CSS khusus untuk editor:
- ProseMirror styling
- Block-based layout
- Responsive design
- Focus indicators
- Placeholder styling

## Teknologi yang Digunakan

### Core Libraries
- **Tiptap**: Modern WYSIWYG editor framework
- **markdown-it**: Markdown parser
- **TurndownService**: HTML to Markdown converter
- **React**: UI framework

### Tiptap Extensions
- StarterKit: Basic editing functionality
- Placeholder: Dynamic placeholders
- TaskList & TaskItem: Checkbox lists
- Table family: Table support
- Image & Link: Media support
- Typography: Smart typography
- Focus: Block focus indicators

## Implementasi

### 1. Setup Dependencies
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install @tiptap/extension-task-list @tiptap/extension-task-item
npm install @tiptap/extension-table @tiptap/extension-table-row
npm install @tiptap/extension-table-header @tiptap/extension-table-cell
npm install @tiptap/extension-image @tiptap/extension-link
npm install @tiptap/extension-underline @tiptap/extension-text-style
npm install @tiptap/extension-color @tiptap/extension-highlight
npm install @tiptap/extension-typography @tiptap/extension-focus
npm install @tiptap/extension-dropcursor @tiptap/extension-gapcursor
npm install markdown-it uuid
```

### 2. Basic Usage
```tsx
import BlockBasedEditor from './components/BlockBasedEditor'

const MyApp = () => {
  const handleSave = async (noteId, title, content) => {
    // Save logic here
  }
  
  const handleCancel = () => {
    // Cancel logic here
  }
  
  return (
    <BlockBasedEditor
      note={note}
      onSave={handleSave}
      onCancel={handleCancel}
      className="h-screen"
    />
  )
}
```

### 3. Kustomisasi
Editor dapat dikustomisasi dengan:
- Menambah/mengurangi Tiptap extensions
- Menyesuaikan toolbar
- Mengubah styling CSS
- Menambahkan slash commands
- Custom block types

## Roadmap

### Planned Features
1. **Slash Commands Menu**: Quick block insertion dengan "/"
2. **Drag & Drop**: Reorder blocks dengan drag & drop
3. **Collaborative Editing**: Real-time collaboration
4. **Version History**: Track perubahan dokumen
5. **Advanced Tables**: Resizable columns, cell merging
6. **Media Upload**: Drag & drop file upload
7. **Export Options**: PDF, HTML, berbagai format
8. **Template System**: Pre-defined templates
9. **Plugin Architecture**: Custom plugins
10. **Advanced Search**: Full-text search dalam editor

### Technical Improvements
1. **Performance**: Virtual scrolling untuk dokumen besar
2. **Accessibility**: ARIA labels dan keyboard navigation
3. **Offline Support**: Local editing tanpa internet
4. **Mobile**: Gesture controls untuk mobile
5. **Syntax Highlighting**: Code block syntax highlighting

## Demo

Akses demo editor di: `/editor-demo`

Demo menampilkan:
- Semua fitur formatting
- Mode switching
- Real-time conversion
- Sample content dengan berbagai block types

## Development Notes

### Architecture Decisions
1. **Tiptap over alternatives**: Lebih modular dan extensible
2. **Debounced conversion**: Balance antara real-time dan performa
3. **Separate markdown state**: Prevent infinite loops
4. **CSS-in-JS avoided**: Menggunakan CSS file untuk performa

### Performance Considerations
1. **Lazy loading**: Extensions di-load sesuai kebutuhan
2. **Memoization**: Prevent unnecessary re-renders
3. **Debouncing**: Reduce conversion frequency
4. **Virtual scrolling**: Untuk dokumen besar (planned)

### Browser Support
- Modern browsers (ES2018+)
- Mobile browsers
- Touch device optimization
- Progressive enhancement

## Contributing

Untuk berkontribusi:
1. Fork repository
2. Buat feature branch
3. Implement dengan tests
4. Submit pull request

Fokus area untuk kontribusi:
- Slash commands implementation
- Additional Tiptap extensions
- Mobile UX improvements
- Performance optimizations
- Accessibility features

## 🚀 Latest Updates - Advanced Block Editor

### ✅ Completed Features (Latest)

#### 1. Interactive Slash Command Menu
- **Full implementation** of `/` command menu with real-time filtering
- **Keyboard navigation** (Arrow keys, Enter, Escape)
- **Mouse interaction** support with hover states
- **Commands available**: Headings (H1-H3), Text, Lists (Bullet/Numbered/Task), Quote, Code Block, Divider, Table, Image
- **Smart positioning** using Tippy.js for better UX
- **Real-time search** with keyword matching

#### 2. Advanced Block-Based Editor (`AdvancedBlockEditor.tsx`)
- **Individual block editing** - Each block is independently editable with Tiptap
- **Drag & drop reordering** using @dnd-kit/core with smooth animations
- **Block metadata system** - Timestamps, versioning, positioning, tags, collaborators
- **Block types**: paragraph, heading, bulletList, orderedList, taskList, blockquote, codeBlock, table, image, horizontalRule
- **Visual feedback** - Hover states, selection indicators, drag indicators
- **Block operations**: Add, delete, reorder, update with real-time saving

#### 3. Enhanced UI/UX
- **Dedicated demo page** at `/advanced-editor` 
- **Navigation links** in Header (Basic Editor + Block Editor)
- **Mobile-responsive** design with touch-friendly controls
- **Block controls** appear on hover (drag handle, metadata, delete)
- **Real-time feedback** for save operations
- **Keyboard shortcuts**: Ctrl+S (save), Ctrl+Enter (add block)

#### 4. Technical Improvements
- **Better error handling** with graceful fallbacks
- **Optimized performance** with debounced updates and efficient re-renders
- **Type safety** with comprehensive TypeScript interfaces
- **CSS styling** without @apply directives for better compatibility
- **Accessibility** features (ARIA labels, keyboard navigation)

### 🎯 Advanced Block Editor Features

#### Block-Level Operations
```typescript
interface EditorBlock {
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
```

#### Drag & Drop System
- **Visual feedback** during drag operations
- **Smooth animations** using CSS transforms
- **Position indicators** show where blocks will be dropped
- **Automatic position updates** maintain data consistency

#### Slash Command Integration
- **Context-aware** commands based on cursor position
- **Instant execution** of formatting commands
- **Smart text replacement** removes command trigger
- **Extensible architecture** for adding new commands

### 📋 Demo Pages Available

1. **Basic Editor Demo** (`/editor-demo`)
   - Traditional WYSIWYG + Markdown sync
   - Toolbar-based formatting
   - Real-time preview switching

2. **Advanced Block Editor** (`/advanced-editor`)
   - Block-based editing with drag & drop
   - Individual block management
   - Enhanced slash commands
   - Metadata tracking

### 🔧 Usage Examples

#### Adding Slash Commands
```typescript
const newCommand: SlashCommandItem = {
  id: 'custom',
  title: 'Custom Block',
  description: 'Insert custom content',
  icon: CustomIcon,
  keywords: ['custom', 'special'],
  action: (editor) => {
    editor.chain().focus().setHorizontalRule().run()
  }
}
```

#### Block Operations
```typescript
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
}
```

### 🎨 Styling System
- **CSS Custom Properties** for consistent theming
- **Responsive design** with mobile-first approach  
- **Smooth transitions** for all interactive elements
- **Focus indicators** for accessibility
- **Drag visual feedback** with opacity and transform effects
