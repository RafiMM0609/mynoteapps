# MyNotes - Quick Start ⚡

Modern notes application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Quick Setup (5 minutes)

### 1. Install & Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

### 2. (Optional) Setup Database
For full functionality, setup Supabase:

1. Go to [supabase.com](https://supabase.com) → Create project
2. Copy URL and anon key to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-secret-key-minimum-32-characters
```
3. In Supabase SQL Editor, run the `supabase-schema.sql` file

That's it! 🎉

## ✨ Features Ready Out of the Box

- ✅ **User Authentication** - Register, login, logout
- ✅ **Rich Text Editor** - Markdown support with live preview  
- ✅ **Notes Management** - Create, edit, delete, auto-save
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Modern UI** - Clean, intuitive interface
- ✅ **Security** - JWT tokens, password hashing, RLS

## 📱 Usage

1. **Register/Login** - Create account or sign in
2. **Create Note** - Click "+" to add new note
3. **Edit** - Rich markdown editor with toolbar
4. **Preview** - Toggle between edit/preview/split modes
5. **Auto-save** - Changes saved automatically

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT + bcrypt
- **Icons**: Heroicons

## 📁 Project Structure

```
mynotes-app/
├── app/                  # Next.js App Router
│   ├── api/             # API endpoints
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main page
├── components/          # React components
├── lib/                 # Utilities & config
├── hooks/              # Custom hooks
└── supabase-schema.sql # Database schema
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
Add environment variables in Vercel dashboard.

### Other Platforms
- Netlify, Railway, Heroku
- Set environment variables
- Connect to Supabase

## 📖 Detailed Guides

- **Setup Guide**: `SETUP_GUIDE.md` - Detailed setup instructions
- **Testing Guide**: `TESTING_GUIDE.md` - How to test all features
- **Full README**: `README.md` - Complete documentation

## 🔧 Troubleshooting

**App not loading?**
- Check console for errors
- Verify environment variables
- Ensure port 3000 is available

**Database errors?**
- Check Supabase credentials
- Verify schema is applied
- Check Supabase project status

**Build errors?**
```bash
npm run type-check  # Check TypeScript
rm -rf .next        # Clear cache
npm run build       # Rebuild
```

## 💡 Pro Tips

- **Keyboard Shortcuts**: `Ctrl+S` save, `Ctrl+B` bold, `Ctrl+I` italic
- **Mobile**: Swipe sidebar for mobile navigation
- **Formatting**: Use toolbar or type markdown directly
- **Search**: Feature ready for implementation

## 🎯 Next Steps

Want to extend the app?
- Add search functionality
- Implement categories/tags
- Add export/import features
- Integrate AI features (Gemini ready)
- Add collaboration features

---

**Need help?** Check the detailed guides or create an issue.

**Happy note-taking!** 📝✨
