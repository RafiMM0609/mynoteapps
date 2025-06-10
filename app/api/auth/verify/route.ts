import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const supabase = createClient()

    // Verify token and get user
    const { data: tokenData, error: tokenError } = await supabase
      .from('auth_tokens')
      .select(`
        id,
        user_id,
        expires_at,
        users (
          id,
          email
        )
      `)
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    if (now > expiresAt) {
      // Delete expired token
      await supabase
        .from('auth_tokens')
        .delete()
        .eq('id', tokenData.id)

      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: tokenData.users
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabase = createClient()

    // Delete token (logout)
    const { error } = await supabase
      .from('auth_tokens')
      .delete()
      .eq('token', token)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Logged out successfully' })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
