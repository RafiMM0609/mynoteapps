// Supabase Edge Function for Authentication
// Deploy this manually to your Supabase project
// Follows the same pattern as notes CRUD for consistency

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    // Extract action from path (login, register, verify, logout)
    const action = pathSegments[pathSegments.length - 1]
    const isAuthAction = ['login', 'register', 'verify', 'logout'].includes(action)

    if (!isAuthAction) {
      return new Response(
        JSON.stringify({ error: 'Invalid auth action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (method) {
      case 'POST':
        if (action === 'login') {
          // Login user
          const { email, password } = await req.json()

          if (!email || !password) {
            return new Response(
              JSON.stringify({ error: 'Email and password are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Check if user exists
          const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('id, email, password_hash')
            .eq('email', email.toLowerCase())
            .single()

          if (userError || !user) {
            return new Response(
              JSON.stringify({ error: 'User not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Verify password
          const { data: passwordValid, error: passwordError } = await supabaseClient
            .rpc('verify_password', {
              password: password,
              hash: user.password_hash
            })

          if (passwordError || !passwordValid) {
            return new Response(
              JSON.stringify({ error: 'Invalid password' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Generate token
          const { data: tokenData, error: tokenError } = await supabaseClient
            .rpc('generate_token')

          if (tokenError || !tokenData) {
            return new Response(
              JSON.stringify({ error: 'Failed to generate token' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Store token in database with 7 days expiration
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 7)

          const { error: insertTokenError } = await supabaseClient
            .from('auth_tokens')
            .insert({
              user_id: user.id,
              token: tokenData,
              expires_at: expiresAt.toISOString()
            })

          if (insertTokenError) {
            return new Response(
              JSON.stringify({ error: 'Failed to create session' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              token: tokenData,
              user: {
                id: user.id,
                email: user.email
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } else if (action === 'register') {
          // Register new user
          const { email, password } = await req.json()

          if (!email || !password) {
            return new Response(
              JSON.stringify({ error: 'Email and password are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          if (password.length < 6) {
            return new Response(
              JSON.stringify({ error: 'Password must be at least 6 characters' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Check if user already exists
          const { data: existingUser } = await supabaseClient
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single()

          if (existingUser) {
            return new Response(
              JSON.stringify({ error: 'User already exists' }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Hash password
          const { data: passwordHash, error: hashError } = await supabaseClient
            .rpc('hash_password', { password })

          if (hashError || !passwordHash) {
            return new Response(
              JSON.stringify({ error: 'Failed to process password' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Create new user
          const { data: newUser, error: createUserError } = await supabaseClient
            .from('users')
            .insert({
              email: email.toLowerCase(),
              password_hash: passwordHash
            })
            .select()
            .single()

          if (createUserError) {
            return new Response(
              JSON.stringify({ error: 'Failed to create user' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Generate token
          const { data: tokenData, error: tokenError } = await supabaseClient
            .rpc('generate_token')

          if (tokenError || !tokenData) {
            return new Response(
              JSON.stringify({ error: 'Failed to generate token' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Store token in database
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 7)

          const { error: insertTokenError } = await supabaseClient
            .from('auth_tokens')
            .insert({
              user_id: newUser.id,
              token: tokenData,
              expires_at: expiresAt.toISOString()
            })

          if (insertTokenError) {
            return new Response(
              JSON.stringify({ error: 'Failed to create session' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              token: tokenData,
              user: {
                id: newUser.id,
                email: newUser.email
              }
            }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } else if (action === 'verify') {
          // Verify token
          const authHeader = req.headers.get('authorization')
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
              JSON.stringify({ error: 'Authentication required' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const token = authHeader.substring(7)

          // Verify token and get user
          const { data: tokenData, error: tokenError } = await supabaseClient
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
            return new Response(
              JSON.stringify({ error: 'Invalid token' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Check if token is expired
          const now = new Date()
          const expiresAt = new Date(tokenData.expires_at)

          if (now > expiresAt) {
            // Delete expired token
            await supabaseClient
              .from('auth_tokens')
              .delete()
              .eq('id', tokenData.id)

            return new Response(
              JSON.stringify({ error: 'Token expired' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              user: tokenData.users
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } else {
          return new Response(
            JSON.stringify({ error: 'Invalid POST action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      case 'DELETE':
        if (action === 'verify' || action === 'logout') {
          // Logout (delete token)
          const authHeader = req.headers.get('authorization')
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
              JSON.stringify({ message: 'No active session' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const token = authHeader.substring(7)

          // Delete the token
          const { error } = await supabaseClient
            .from('auth_tokens')
            .delete()
            .eq('token', token)

          if (error) {
            console.error('Logout error:', error)
          }

          return new Response(
            JSON.stringify({ message: 'Logged out successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } else {
          return new Response(
            JSON.stringify({ error: 'Invalid DELETE action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


