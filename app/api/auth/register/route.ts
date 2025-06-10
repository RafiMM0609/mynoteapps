import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const { data: hashedPassword, error: hashError } = await supabase
      .rpc('hash_password', { password })

    if (hashError || !hashedPassword) {
      return NextResponse.json(
        { error: 'Failed to process password' },
        { status: 500 }
      )
    }

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword
      })
      .select('id, email')
      .single()

    if (userError || !newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_token')

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      )
    }

    // Store token in database with 7 days expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: insertTokenError } = await supabase
      .from('auth_tokens')
      .insert({
        user_id: newUser.id,
        token: tokenData,
        expires_at: expiresAt.toISOString()
      })

    if (insertTokenError) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Create welcome note for new user
    await supabase
      .from('notes')
      .insert({
        user_id: newUser.id,
        title: 'Welcome to MyNotes',
        content: '<h2>Welcome to MyNotes!</h2><p>This is your first note. You can:</p><ul><li><strong>Create</strong> new notes by clicking "New Note"</li><li><strong>Edit</strong> notes by clicking the "Edit Note" button</li><li><strong>Delete</strong> notes from the sidebar</li><li><strong>Format text</strong> using the toolbar in edit mode</li></ul><p>The editor supports <strong>bold</strong>, <em>italic</em>, headings, lists, and more!</p><p>Your notes are private and only accessible to you.</p>'
      })

    return NextResponse.json({
      token: tokenData,
      user: {
        id: newUser.id,
        email: newUser.email
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
