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

    const supabase = createClient()

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const { data: passwordValid, error: passwordError } = await supabase
      .rpc('verify_password', {
        password: password,
        hash: user.password_hash
      })

    if (passwordError || !passwordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
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
        user_id: user.id,
        token: tokenData,
        expires_at: expiresAt.toISOString()
      })

    if (insertTokenError) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      token: tokenData,
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
