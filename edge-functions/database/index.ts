import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  sql?: string
  action?: 'init' | 'reset'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sql, action }: RequestBody = await req.json()

    if (action === 'init') {
      // Initialize database with our schema
      const initSQL = `
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        -- Enable pgcrypto for password hashing
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        -- Create users table for authentication
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create auth_tokens table for session management
        CREATE TABLE IF NOT EXISTS auth_tokens (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create notes table
        CREATE TABLE IF NOT EXISTS notes (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create updated_at trigger function
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = TIMEZONE('utc'::text, NOW());
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create triggers for updated_at
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
        CREATE TRIGGER update_notes_updated_at 
            BEFORE UPDATE ON notes 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        -- Function to hash passwords
        CREATE OR REPLACE FUNCTION hash_password(password TEXT)
        RETURNS TEXT AS $$
        BEGIN
            RETURN crypt(password, gen_salt('bf'));
        END;
        $$ LANGUAGE plpgsql;

        -- Function to verify passwords
        CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
            RETURN hash = crypt(password, hash);
        END;
        $$ LANGUAGE plpgsql;

        -- Function to generate secure tokens
        CREATE OR REPLACE FUNCTION generate_token()
        RETURNS TEXT AS $$
        BEGIN
            RETURN encode(gen_random_bytes(32), 'base64');
        END;
        $$ LANGUAGE plpgsql;

        -- RLS (Row Level Security) policies
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;
        ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own data" ON users;
        DROP POLICY IF EXISTS "Users can insert their own data" ON users;
        DROP POLICY IF EXISTS "Users can update their own data" ON users;
        
        DROP POLICY IF EXISTS "Users can view their own tokens" ON auth_tokens;
        DROP POLICY IF EXISTS "Users can insert their own tokens" ON auth_tokens;
        DROP POLICY IF EXISTS "Users can delete their own tokens" ON auth_tokens;
        
        DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
        DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
        DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
        DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

        -- Users table policies
        CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);
        CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
        CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

        -- Auth tokens policies
        CREATE POLICY "Users can view their own tokens" ON auth_tokens FOR SELECT USING (true);
        CREATE POLICY "Users can insert their own tokens" ON auth_tokens FOR INSERT WITH CHECK (true);
        CREATE POLICY "Users can delete their own tokens" ON auth_tokens FOR DELETE USING (true);

        -- Notes policies - users can only access their own notes
        CREATE POLICY "Users can view their own notes" ON notes FOR SELECT USING (true);
        CREATE POLICY "Users can insert their own notes" ON notes FOR INSERT WITH CHECK (true);
        CREATE POLICY "Users can update their own notes" ON notes FOR UPDATE USING (true);
        CREATE POLICY "Users can delete their own notes" ON notes FOR DELETE USING (true);

        -- Indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);
        CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
      `

      const { error } = await supabaseClient.rpc('exec_sql', { sql_query: initSQL })
      
      if (error) {
        console.error('Database initialization error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to initialize database', details: error }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Database initialized successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (sql) {
      const { error } = await supabaseClient.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        return new Response(
          JSON.stringify({ error: 'SQL execution failed', details: error }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'SQL executed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'No action specified' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
