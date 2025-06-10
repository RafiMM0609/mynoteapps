import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
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
      return null
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

      return null
    }

    return tokenData.users as AuthUser

  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export function createAuthResponse(message: string = 'Authentication required') {
  return Response.json(
    { error: message },
    { status: 401 }
  )
}
