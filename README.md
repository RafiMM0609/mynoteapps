# MyNotes - Modern Notes Application

Aplikasi catatan modern yang dibangun dengan Next.js, TypeScript, Tailwind CSS, dan Supabase. Menampilkan antarmuka yang bersih dengan dukungan formatting Markdown yang kaya untuk editing teks.

## 🚀 Fitur Utama

### ✨ User Interface & Experience
- **Modern UI**: Desain clean dengan gray dan white theme yang responsive
- **Mobile-First**: Optimized untuk desktop, tablet, dan mobile
- **Split-View**: Mode edit dan preview yang dapat digunakan bersamaan
- **Real-time Feedback**: Toast notifications dan visual feedback
- **Smooth user experience when edit or type the notes**: Easy to user note, event old man can used it easyly
- **Easy to user formatting tools**: People can use or unused the formating tools easyly, so it doesnt make people stressed
- **Code Formatter Support**: Can support code formatter like python, javascript, mysql

### 📝 Rich Text Editor
- **Markdown Formatting**: Bold, italic, headings, lists, dan code blocks
- **Enhanced Code Blocks**: Modern syntax highlighting dengan copy-to-clipboard
- **Inline Code Styling**: Beautiful inline code dengan language-specific colors
- **Slash Commands**: Ketik "/" untuk quick access ke formatting tools
- **Clean Paste**: Automatic paste formatting cleanup dari external sources
- **Keyboard Shortcuts**: Ctrl+B, Ctrl+I, Ctrl+Shift+V, dan lainnya
- **Auto-save**: Seamless saving dengan real-time updates

### 🔗 Enhanced Note Organization
- **Smart Filtering**: Tampilkan hanya note utama (unlinked) untuk organisasi yang lebih bersih
- **Note Linking**: Sistem linking antar notes untuk membuat hierarki
- **Dual View Modes**: 
  - **Main Notes**: Hanya menampilkan note yang tidak di-link oleh note lain
  - **All Notes**: Menampilkan semua note termasuk yang sudah di-link
- **View Toggle**: Beralih antara List view dan Tree view
- **Hierarchical Organization**: Tree structure dengan expand/collapse functionality
- **Auto-hide Linked Notes**: Note yang di-link otomatis tersembunyi dari main view

### 🏗️ Authentication & Security
- **User Authentication**: Secure login/register system
- **JWT Token**: Session management dengan expiry
- **Row Level Security**: Database-level security dengan Supabase RLS
- **Password Hashing**: Bcrypt encryption untuk password

### 🤖 AI Integration
- **Gemini AI**: Integrasi dengan Google Gemini AI
- **Web Search**: Real-time web search untuk informasi terkini
- **Multi-Source**: Support SerpAPI, Google Custom Search, Bing
- **Smart Responses**: Respons AI yang contextual dan informatif

### 📱 Responsive Design
- **Mobile Sidebar**: Slide-out navigation untuk mobile
- **Touch Optimized**: Optimized untuk touch interfaces
- **Progressive Web App**: Ready untuk PWA implementation

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3 dengan App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect)
- **Icons**: Heroicons

### Backend & Database
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT dengan Supabase
- **File Storage**: Ready untuk Supabase Storage

### Development Tools
- **Linting**: ESLint dengan Next.js config
- **Type Checking**: TypeScript compiler
- **Package Manager**: npm

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Supabase account (untuk production)


## 📖 Cara Penggunaan

### Authentication
1. **Register**: Buat akun baru dengan email dan password
2. **Login**: Masuk dengan credentials yang sudah terdaftar
3. **Session**: Token akan disimpan di localStorage untuk auto-login

### Mengelola Notes
1. **Create**: Klik "New Note" atau gunakan shortcut `Ctrl+N`
2. **Edit**: Pilih note dari sidebar, lalu klik "Edit Note"
3. **Delete**: Klik icon 🗑️ di samping note di sidebar
4. **Search**: Fitur pencarian akan tersedia di header

### Rich Text Editor
- **Formatting**: Gunakan toolbar atau keyboard shortcuts
- **Slash Commands**: Ketik "/" untuk quick formatting access
- **Clean Paste**: Paste dari external sources akan otomatis dibersihkan
- **Preview**: Toggle antara mode edit dan preview

### Keyboard Shortcuts
- `Ctrl+B` - Bold text
- `Ctrl+I` - Italic text
- `Ctrl+N` - New note (global)
- `Ctrl+S` - Save note
- `Ctrl+Shift+V` - Paste as plain text
- `/` - Open slash commands
- `Esc` - Cancel editing

### AI & Search Features
- **Gemini AI**: Akses via `/gemini-search` endpoint
- **Web Search**: Enable search untuk informasi real-time
- **Multiple Engines**: Support berbagai search engines

## 🏗️ Struktur Proyek

```
mynote-app/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   │   ├── login/      # Login handler
│   │   │   ├── register/   # Registration handler
│   │   │   └── verify/     # Token verification
│   │   ├── notes/          # Notes CRUD endpoints
│   │   │   ├── route.ts    # GET/POST notes
│   │   │   └── [id]/       # Individual note operations
│   │   └── gemini-search/  # AI search endpoint
│   ├── gemini-search/      # AI search page
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main application
├── components/             # React components
│   ├── AuthenticatedHome.tsx    # Post-login dashboard
│   ├── GeminiSearchChat.tsx     # AI search interface
│   ├── KeyboardShortcuts.tsx    # Shortcuts help
│   ├── LoginForm.tsx           # Login form
│   ├── NoteEditor_new.tsx      # Rich text editor
│   ├── NoteList.tsx           # Notes sidebar
│   ├── NoteViewer.tsx         # Note display
│   ├── RegisterForm.tsx       # Registration form
│   ├── SlashCommandDropdown.tsx # Slash commands UI
│   ├── Toast.tsx              # Notification system
│   └── Tooltip.tsx            # Tooltip component
├── edge-functions/         # Supabase edge functions
│   ├── auth/              # Authentication functions
│   ├── notes/             # Notes API functions
│   ├── gemini/            # AI integration
│   └── telegram/          # Telegram bot integration
├── hooks/                 # Custom React hooks
│   └── useToast.ts       # Toast notification hook
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── notes.ts          # Notes data management
│   ├── supabase.ts       # Supabase client
│   └── supabase-edge.ts  # Edge function client
├── supabase-schema.sql    # Database schema
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── next.config.js        # Next.js configuration
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Auth Tokens Table
```sql
CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Notes Table
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Integration
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Search Engine APIs (pilih salah satu atau semua)
SEARCH_API_KEY=your-serpapi-key
GOOGLE_API_KEY=your-google-custom-search-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
BING_SEARCH_API_KEY=your-bing-search-key
```

## 🚀 Development Guide

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify token
- `DELETE /api/auth/verify` - Logout (delete token)

#### Notes Management
- `GET /api/notes` - Get user's notes
- `POST /api/notes` - Create new note
- `GET /api/notes/[id]` - Get specific note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

#### AI Integration
- `POST /api/gemini-search` - AI search with web integration

### Supabase Setup

1. **Create Supabase Project**
   ```bash
   # Install Supabase CLI
   npm install -g @supabase/cli
   
   # Login to Supabase
   supabase login
   
   # Initialize project
   supabase init
   ```

2. **Deploy Database Schema**
   ```bash
   # Run schema in Supabase SQL Editor
   # atau gunakan migration
   supabase db push
   ```

3. **Deploy Edge Functions**
   ```bash
   # Deploy semua functions
   supabase functions deploy
   
   # Deploy specific function
   supabase functions deploy gemini-search
   ```

4. **Environment Variables**
   ```bash
   # Set environment variables
   supabase secrets set GOOGLE_GEMINI_API_KEY=your-key
   supabase secrets set SEARCH_API_KEY=your-key
   ```

### Development Workflow

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature
   
   # Make changes
   # Test locally
   npm run dev
   
   # Type check
   npm run type-check
   
   # Lint
   npm run lint
   
   # Commit changes
   git commit -m "feat: add new feature"
   ```

2. **Testing**
   ```bash
   # Manual testing
   npm run dev
   
   # Check browser console for errors
   # Test all user flows
   # Test responsive design
   ```

3. **Deployment**
   ```bash
   # Build for production
   npm run build
   
   # Deploy to Vercel/Netlify
   # atau platform pilihan Anda
   ```

### Code Style Guidelines

#### TypeScript
- Use strict TypeScript dengan proper typing
- Define interfaces untuk data structures
- Use enums untuk constants
- Avoid `any` type kecuali absolutely necessary

#### React Components
- Use functional components dengan hooks
- Keep components small dan focused
- Use proper prop typing
- Implement error boundaries untuk error handling

#### Styling
- Use Tailwind CSS untuk styling
- Follow mobile-first approach
- Use semantic HTML elements
- Maintain consistent spacing dan colors

#### File Organization
- Group related files dalam folders
- Use descriptive file names
- Separate concerns (logic, UI, data)
- Keep components reusable

### Testing Strategy

#### Manual Testing
- Lihat `TESTING_GUIDE.md` untuk detailed testing procedures
- Test semua user flows
- Test berbagai browser dan devices
- Test edge cases dan error scenarios

#### Automated Testing (Future)
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react

# Run tests
npm test

# Run tests dengan coverage
npm run test:coverage
```

### Performance Optimization

#### Frontend
- Use Next.js built-in optimizations
- Implement proper loading states
- Optimize images dengan Next.js Image component
- Use code splitting untuk large bundles

#### Backend
- Implement proper database indexing
- Use connection pooling
- Cache frequently accessed data
- Optimize API response sizes

### Security Considerations

#### Authentication
- Use secure password hashing (bcrypt)
- Implement proper token expiry
- Validate all user inputs
- Use HTTPS dalam production

#### Database
- Enable Row Level Security (RLS)
- Use parameterized queries
- Limit database permissions
- Regular security audits

### Monitoring & Logging

#### Development
```javascript
// Use proper logging
console.log('Development info')
console.error('Error details')

// Use debugging tools
debugger;
```

#### Production
- Setup error tracking (Sentry)
- Monitor performance metrics
- Track user analytics
- Setup uptime monitoring

## 🤖 AI Integration Details

### Gemini AI Configuration

1. **Get API Key**
   - Pergi ke [Google AI Studio](https://aistudio.google.com/)
   - Generate API key
   - Add ke environment variables

2. **Setup Search Integration**
   ```typescript
   // Enable web search
   const response = await fetch('/api/gemini-search', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       text: "Your question here",
       enableSearch: true
     })
   });
   ```

3. **Search Engine Options**
   - **SerpAPI**: 100 free searches/month
   - **Google Custom Search**: 100 free queries/day
   - **Bing Search API**: 1000 free calls/month

### Edge Function Deployment

```bash
# Test locally
supabase functions serve

# Deploy to Supabase
supabase functions deploy gemini-search

# Test deployed function
curl -X POST 'https://your-project.supabase.co/functions/v1/gemini-search' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test question", "enableSearch": true}'
```

## 📚 Learning Resources

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Supabase
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)

## 🔍 Troubleshooting

### Common Issues

#### Authentication Issues
```bash
# Problem: Token expired atau invalid
# Solution: Clear localStorage dan login ulang
localStorage.removeItem('auth_token')

# Problem: CORS errors
# Solution: Check Supabase CORS settings
```

#### Database Connection
```bash
# Problem: Cannot connect to Supabase
# Solution: Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Problem: RLS policies blocking access
# Solution: Check database policies dalam Supabase dashboard
```

#### Build Issues
```bash
# Problem: TypeScript errors
# Solution: Run type checking
npm run type-check

# Problem: Missing dependencies
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Performance Issues
```bash
# Problem: Slow loading
# Solution: Check bundle size
npm run build
npm run analyze

# Problem: Memory leaks
# Solution: Check for uncleaned event listeners
```

### Debug Mode

```javascript
// Enable debug logging
localStorage.setItem('debug', 'true')

// Debug API calls
console.log('API Request:', { url, method, body })
```
