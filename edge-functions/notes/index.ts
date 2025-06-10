// Supabase Edge Function for Notes CRUD operations with Authentication
// Deploy this manually to your Supabase project

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Authentication helper function
async function verifyAuth(req: Request, supabaseClient: any) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
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
      return null
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

      return null
    }

    return tokenData.users

  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
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

    // Verify authentication
    const user = await verifyAuth(req, supabaseClient)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { method } = req
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    // Extract note ID if provided (for individual note operations)
    const noteId = pathSegments[pathSegments.length - 1]
    const isIndividualNote = pathSegments.length > 1 && noteId !== 'notes'

    switch (method) {
      case 'GET':
        if (isIndividualNote) {
          // Get individual note
          const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('id', noteId)
            .single()

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Get all notes
          const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .order('updated_at', { ascending: false })

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      case 'POST':
        // Create new note
        const newNoteData = await req.json()
        
        if (!newNoteData.title?.trim()) {
          return new Response(
            JSON.stringify({ error: 'Title is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: newNote, error: createError } = await supabaseClient
          .from('notes')
          .insert([
            {
              title: newNoteData.title.trim(),
              content: newNoteData.content || '',
            }
          ])
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(newNote),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'PUT':
        // Update existing note
        if (!isIndividualNote) {
          return new Response(
            JSON.stringify({ error: 'Note ID is required for updates' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const updateData = await req.json()
        
        if (!updateData.title?.trim()) {
          return new Response(
            JSON.stringify({ error: 'Title is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: updatedNote, error: updateError } = await supabaseClient
          .from('notes')
          .update({
            title: updateData.title.trim(),
            content: updateData.content || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', noteId)
          .select()
          .single()

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(updatedNote),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'DELETE':
        // Delete note
        if (!isIndividualNote) {
          return new Response(
            JSON.stringify({ error: 'Note ID is required for deletion' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: deleteError } = await supabaseClient
          .from('notes')
          .delete()
          .eq('id', noteId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Note deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
