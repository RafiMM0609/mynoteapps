import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthUser {
  id: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return { id: decoded.userId, email: '' } // Email will be fetched from database
  } catch (error) {
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Get user from token
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = verifyToken(token)
    if (!decoded) return null

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', decoded.id)
      .single()

    if (error || !user) return null

    return { id: user.id, email: user.email }
  } catch (error) {
    return null
  }
}

// Clean expired tokens
export async function cleanExpiredTokens(): Promise<void> {
  await supabase
    .from('auth_tokens')
    .delete()
    .lt('expires_at', new Date().toISOString())
}

// Store token in database
export async function storeToken(userId: string, token: string): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    const { error } = await supabase
      .from('auth_tokens')
      .insert([{
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString()
      }])

    return !error
  } catch (error) {
    return false
  }
}

// Verify token exists in database
export async function verifyTokenInDatabase(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('auth_tokens')
      .select('id')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}

// Remove token from database
export async function removeToken(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('auth_tokens')
      .delete()
      .eq('token', token)

    return !error
  } catch (error) {
    return false
  }
}
