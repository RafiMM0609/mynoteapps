# MyNotes - Testing Guide

## 🧪 Panduan Testing Aplikasi

### Testing Tanpa Database (Mock Mode)

Untuk testing cepat tanpa setup Supabase, kita bisa buat mock data.

#### 1. Buat file testing environment

```bash
# Copy .env.example ke .env.local
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Minimal setup untuk testing
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
JWT_SECRET=test-secret-key-minimum-32-characters-for-jwt-signing
```

#### 2. Testing Flow

1. **Buka aplikasi**: http://localhost:3000
2. **Test Registration**: 
   - Klik "create a new account"
   - Masukkan email & password
   - (Akan error karena database belum setup, tapi UI berfungsi)

3. **Test Login Form**:
   - Form validation works
   - Password visibility toggle
   - Error handling

4. **Test UI Components**:
   - Responsive design
   - Mobile sidebar
   - Toast notifications
   - Loading states

### Testing Dengan Database (Full Mode)

#### Setup Supabase

1. **Buat Supabase Project**:
   - Pergi ke [supabase.com](https://supabase.com)
   - Buat project baru
   - Copy URL dan keys

2. **Setup Database**:
   - Buka SQL Editor di Supabase dashboard
   - Copy paste isi dari `supabase-schema.sql`
   - Execute query untuk buat tables

3. **Update Environment**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-strong-secret-key-here
```

#### Full Feature Testing

1. **Authentication Flow**:
   ```
   Register → Login → Auto-login → Logout
   ```

2. **Notes Management**:
   ```
   Create Note → Edit → Save → Delete → List View
   ```

3. **Editor Features**:
   ```
   Markdown → Preview → Split View → Toolbar → Shortcuts
   ```

### Manual Testing Checklist

#### ✅ Authentication
- [ ] User registration with email/password
- [ ] Form validation (email format, password length)  
- [ ] Login with correct credentials
- [ ] Login error with wrong credentials
- [ ] Auto-login on page refresh
- [ ] Logout functionality
- [ ] Session persistence

#### ✅ Notes CRUD
- [ ] Create new note
- [ ] Edit note title
- [ ] Edit note content
- [ ] Save note (Ctrl+S)
- [ ] Delete note with confirmation
- [ ] List all notes
- [ ] Select note from list

#### ✅ Editor Features
- [ ] Markdown formatting (bold, italic, headers)
- [ ] Toolbar buttons work
- [ ] Keyboard shortcuts (Ctrl+B, Ctrl+I)
- [ ] Live preview mode
- [ ] Split view mode
- [ ] Code syntax highlighting
- [ ] Auto-save functionality

#### ✅ UI/UX
- [ ] Responsive design (desktop/tablet/mobile)
- [ ] Mobile sidebar works
- [ ] Toast notifications appear
- [ ] Loading states shown
- [ ] Error messages displayed
- [ ] Clean paste functionality
- [ ] Smooth animations

#### ✅ Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

### API Testing

Use browser dev tools atau Postman:

#### Authentication Endpoints
```bash
# Register
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "password123"
}

# Login  
POST /api/auth/login
{
  "email": "test@example.com", 
  "password": "password123"
}

# Verify token
POST /api/auth/verify
{
  "token": "your-jwt-token"
}
```

#### Notes Endpoints
```bash
# Get all notes
GET /api/notes
Authorization: Bearer your-jwt-token

# Create note
POST /api/notes
Authorization: Bearer your-jwt-token
{
  "title": "Test Note",
  "content": "# Hello World"
}

# Update note
PUT /api/notes/{id}
Authorization: Bearer your-jwt-token
{
  "title": "Updated Title",
  "content": "Updated content"
}

# Delete note
DELETE /api/notes/{id}
Authorization: Bearer your-jwt-token
```

### Performance Testing

#### Load Testing
- Multiple notes (100+)
- Large content (10KB+ markdown)
- Concurrent users
- Mobile performance

#### Memory Testing
- Check for memory leaks
- Long editing sessions
- Multiple browser tabs

### Security Testing

#### Input Validation
- SQL injection attempts
- XSS attempts  
- Invalid JWT tokens
- Expired tokens
- CSRF protection

#### Authentication
- Token expiry handling
- Unauthorized access attempts
- Password strength requirements

### Debugging Tips

#### Browser Dev Tools
```javascript
// Check authentication state
localStorage.getItem('auth_token')

// Enable debug logging
localStorage.setItem('debug', 'true')

// Clear auth data
localStorage.removeItem('auth_token')
```

#### Network Tab
- Check API requests/responses
- Verify status codes
- Check request headers
- Monitor response times

#### Console Errors
- Check for JavaScript errors
- Verify API error messages
- Monitor network failures

### Common Issues & Solutions

#### 1. "Cannot connect to Supabase"
- Check environment variables
- Verify Supabase project status
- Check network connectivity

#### 2. "JWT Token Invalid" 
- Check JWT_SECRET in .env.local
- Verify token format
- Check token expiry

#### 3. "Database Connection Error"
- Check Supabase URL/keys
- Verify database schema applied
- Check RLS policies

#### 4. "Build/Runtime Errors"
- Run `npm run type-check`
- Check TypeScript errors
- Verify imports/exports

### Automated Testing (Future)

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Testing Data

Use these sample data for testing:

```javascript
// Sample users
const testUsers = [
  { email: "john@example.com", password: "password123" },
  { email: "jane@example.com", password: "password456" }
]

// Sample notes
const testNotes = [
  {
    title: "Meeting Notes",
    content: "# Meeting with Team\n\n- Discuss project timeline\n- Review requirements"
  },
  {
    title: "Code Snippets", 
    content: "```javascript\nconst hello = () => console.log('Hello World')\n```"
  }
]
```

Happy testing! 🚀
