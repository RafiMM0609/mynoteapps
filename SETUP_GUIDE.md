# MyNotes - Quick Setup Guide

## 🚀 Panduan Setup Cepat

### 1. Install Dependencies
Pastikan semua dependencies sudah terinstall:
```bash
npm install
```

### 2. Setup Database (Supabase)

#### Opsi A: Menggunakan Supabase Cloud (Recommended)
1. Pergi ke [Supabase.com](https://supabase.com) dan buat akun
2. Buat project baru
3. Di dashboard project, pergi ke Settings > API
4. Copy URL dan anon key ke file `.env.local`
5. Di SQL Editor, jalankan script dari `supabase-schema.sql`

#### Opsi B: Local Development
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login ke Supabase
supabase login

# Start local instance
supabase start

# Apply schema
supabase db reset
```

### 3. Environment Variables
Copy `.env.example` ke `.env.local` dan isi:

```env
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-secret-key-minimum-32-characters

# Optional - AI Integration  
GOOGLE_GEMINI_API_KEY=your-gemini-key
```

### 4. Jalankan Aplikasi
```bash
# Development mode
npm run dev

# Build untuk production
npm run build
npm run start
```

Aplikasi akan berjalan di http://localhost:3000

## 🗄️ Database Schema

Database akan otomatis dibuat dengan tables:
- `users` - User authentication
- `auth_tokens` - Session management
- `notes` - User notes

## ✨ Fitur Yang Sudah Ready

### Authentication ✅
- User registration
- Login/logout
- JWT token management
- Session persistence

### Notes Management ✅  
- Create, read, update, delete notes
- Rich markdown editor
- Real-time preview
- Auto-save functionality

### UI/UX ✅
- Responsive design (mobile-friendly)
- Modern clean interface
- Toast notifications
- Loading states
- Error handling

### Security ✅
- Password hashing (bcrypt)
- JWT tokens with expiry
- Row Level Security (RLS)
- Input sanitization

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot connect to Supabase"**
   - Check environment variables
   - Verify Supabase project is running
   - Check network connection

2. **"JWT Secret not set"**
   - Add JWT_SECRET to .env.local
   - Use a strong secret (minimum 32 characters)

3. **"Build errors"**
   - Run `npm run type-check`
   - Fix TypeScript errors
   - Clear `.next` folder: `rm -rf .next`

4. **"Database errors"**
   - Check Supabase dashboard for errors
   - Verify RLS policies are enabled
   - Check SQL schema is applied correctly

### Development Tips

1. **Hot Reload**: Changes auto-reload in development
2. **Type Safety**: Use TypeScript for better development experience  
3. **API Testing**: Use browser dev tools or Postman
4. **Database**: Use Supabase dashboard for direct DB access

## 📱 Mobile Support

Aplikasi sudah dioptimalkan untuk mobile:
- Responsive sidebar
- Touch-friendly interface  
- Mobile-first design
- PWA ready (Progressive Web App)

## 🎨 Customization

### Colors & Theme
Edit `tailwind.config.js` untuk mengubah color scheme

### Components
Semua komponen ada di folder `components/`:
- `LoginForm.tsx` - Login interface
- `RegisterForm.tsx` - Registration
- `NoteEditor_new.tsx` - Rich text editor
- `NoteViewer.tsx` - Note display
- `NoteList.tsx` - Notes sidebar
- `Toast.tsx` - Notifications

### API Routes
API endpoints di `app/api/`:
- `/api/auth/*` - Authentication
- `/api/notes/*` - Notes CRUD operations

## 🚀 Production Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Other Platforms
- Netlify
- Heroku  
- Railway
- AWS/GCP/Azure

### Pre-deployment Checklist
- [ ] Environment variables set
- [ ] Database schema applied
- [ ] Build succeeds (`npm run build`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] All features tested

## 🔐 Security Notes

- Passwords hashed dengan bcrypt
- JWT tokens dengan expiry time
- Row Level Security enabled di Supabase
- Input validation dan sanitization
- HTTPS required untuk production

## 📞 Support

Jika ada masalah:
1. Check console errors (F12)
2. Verify environment variables
3. Check Supabase logs
4. Review README.md lengkap

Aplikasi sudah production-ready dengan semua fitur authentication, notes management, dan UI yang responsif!
