# MyNotes - React Notes Application

A modern notes application built with Next.js, TypeScript, and Tailwind CSS. Features a clean gray and white interface with **Markdown support** for rich text editing.

## Features

- ✨ **Modern UI**: Clean gray and white design with responsive layout
- 📝 **Markdown Editor**: Full-featured Markdown editor with live preview
- 👀 **Preview Mode**: Toggle between edit and preview modes
- 🔄 **Format Migration**: Automatic conversion from HTML to Markdown
- 💾 **Auto-save**: Seamless saving with real-time updates
- 🗑️ **Easy Management**: Create, edit, delete, and organize notes
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices
- ⚡ **Fast**: Built with Next.js 15 and optimized for performance
- 🤖 **AI Integration**: Gemini AI with web search capabilities
- 🔍 **Smart Search**: Real-time web search integration for up-to-date information
- 🌐 **Multi-Source**: Support for multiple search engines (SerpAPI, Google, Bing)

## Tech Stack

- **Frontend**: Next.js 15.3.3, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes (ready for Supabase integration)
- **Database**: In-memory storage (development) → Supabase (production)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mynote-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating Notes
1. Click the "New Note" button in the sidebar
2. Enter a title for your note
3. Write your content using Markdown syntax
4. Use the preview mode to see rendered output
5. Click "Save" to store your note

### Editing Notes
1. Select a note from the sidebar
2. Click "Edit Note" in the viewer
3. Make your changes using the Markdown editor
4. Save your changes

### Markdown Formatting
- **Bold text**: `**bold**` or `__bold__`
- **Italic text**: `*italic*` or `_italic_`
- **Headings**: `#` for H1, `##` for H2, `###` for H3
- **Lists**: `-` for bullet lists, `1.` for numbered lists
- **Code**: `` `inline code` `` or ``` for code blocks
- **Links**: `[text](url)`
- **Images**: `![alt](image-url)`
- **Lists**: Bulleted and numbered lists
- **Code blocks**: For syntax highlighting
- **Preview mode**: Toggle to see rendered HTML

### Deleting Notes
1. Find the note in the sidebar
2. Click the delete icon (🗑️)
3. Confirm deletion in the dialog

## Project Structure

```
mynote-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── notes/         # Notes CRUD endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── NoteEditor.tsx     # Rich text editor
│   ├── NoteList.tsx       # Notes sidebar
│   └── NoteViewer.tsx     # Note display
├── lib/                   # Utility functions
│   └── notes.ts           # Notes data management
├── edge-functions/        # Supabase edge functions
│   └── notes/             # Notes API for Supabase
└── supabase-schema.sql    # Database schema
```

## Supabase Integration (Future)

The application is ready for Supabase integration. To set up:

1. **Create a Supabase project**
2. **Run the schema**: Execute `supabase-schema.sql` in your Supabase SQL editor
3. **Deploy edge functions**: Use the functions in `edge-functions/notes/`
4. **Update API endpoints**: Switch from local API routes to Supabase functions
5. **Add environment variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### API Routes

- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `GET /api/notes/[id]` - Get a specific note
- `PUT /api/notes/[id]` - Update a note
- `DELETE /api/notes/[id]` - Delete a note

## 🤖 Gemini AI dengan Search Engine

Aplikasi ini telah diintegrasikan dengan Gemini AI yang dilengkapi kemampuan pencarian web real-time.

### Fitur AI
- **Smart Responses**: Respons AI yang cerdas dan kontekstual
- **Web Search Integration**: Pencarian informasi terkini dari web
- **Multiple Search Engines**: Dukungan SerpAPI, Google Custom Search, dan Bing
- **Source Tracking**: Melacak sumber informasi yang digunakan
- **Flexible Usage**: Dapat digunakan dengan atau tanpa pencarian web

### Akses Fitur AI
- 🌐 **Web Interface**: `/gemini-search` - Interface web yang user-friendly
- 🔗 **API Endpoint**: `/api/gemini-search` - REST API untuk integrasi
- ⚡ **Edge Function**: Supabase Edge Function untuk performa optimal

### Quick Start AI
```bash
# Deploy edge function
.\deploy-gemini-search.ps1 local

# Test via API
curl -X POST 'http://localhost:3000/api/gemini-search' \
  -H 'Content-Type: application/json' \
  -d '{"text": "Apa berita teknologi terbaru?", "enableSearch": true}'
```

Lihat [dokumentasi lengkap AI](./edge-functions/gemini/README.md) untuk setup dan konfigurasi.

## Migration from HTML to Markdown

If you have existing notes in HTML format, this app automatically detects and converts them to Markdown when you edit them. You can also run a bulk migration:

### Automatic Migration
- When you open an HTML note for editing, it's automatically converted to Markdown
- The conversion preserves formatting like headings, bold, italic, lists, and code blocks
- Original data is safely migrated without data loss

### Manual Migration (Bulk)
To convert all existing HTML notes to Markdown at once:

```bash
# Run the migration script
npm run migrate-notes migrate

# To see migration status
npm run migrate-notes rollback  # (not implemented yet)
```

### Migration Features
- ✅ **Headings**: `<h1>` → `#`, `<h2>` → `##`, etc.
- ✅ **Text formatting**: `<strong>` → `**bold**`, `<em>` → `*italic*`
- ✅ **Lists**: `<ul>/<li>` → `- item`, `<ol>/<li>` → `1. item`
- ✅ **Code**: `<code>` → `` `code` ``, `<pre>` → ``` code blocks
- ✅ **Line breaks**: `<br>` → newlines
- ✅ **Paragraphs**: `<p>` tags converted to proper spacing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Ready for [Supabase](https://supabase.com/) integration
#   m y n o t e a p p s 
 
 