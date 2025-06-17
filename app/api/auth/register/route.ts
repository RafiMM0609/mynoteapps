import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { generateToken, storeToken } from '../../../../lib/auth'

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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password using Supabase function
    const { data: hashedPassword, error: hashError } = await supabase
      .rpc('hash_password', { password })

    if (hashError || !hashedPassword) {
      return NextResponse.json(
        { error: 'Failed to process password' },
        { status: 500 }
      )
    }

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password_hash: hashedPassword
      }])
      .select('id, email')
      .single()

    if (createError || !newUser) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = generateToken(newUser.id)

    // Store token in database
    const tokenStored = await storeToken(newUser.id, token)
    if (!tokenStored) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email
      },
      token
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
