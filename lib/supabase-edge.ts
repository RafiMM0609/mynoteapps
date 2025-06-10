// Supabase configuration for Edge Functions
// Create this file as lib/supabase-edge.ts

interface EdgeFunctionConfig {
  supabaseUrl: string
  anonKey: string
}

class SupabaseEdgeClient {
  private config: EdgeFunctionConfig

  constructor(config: EdgeFunctionConfig) {
    this.config = config
  }

  private async makeRequest(
    functionName: string, 
    path: string = '', 
    options: RequestInit = {}
  ) {
    const url = `${this.config.supabaseUrl}/functions/v1/${functionName}${path}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'apikey': this.config.anonKey,
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }
    
    return data
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.makeRequest('auth', '/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email: string, password: string) {
    return this.makeRequest('auth', '/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async verifyToken(token: string) {
    return this.makeRequest('auth', '/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async logout(token: string) {
    return this.makeRequest('auth', '/verify', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Notes methods
  async getNotes(token: string) {
    return this.makeRequest('notes', '', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async createNote(token: string, title: string, content: string) {
    return this.makeRequest('notes', '', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    })
  }

  async getNote(token: string, noteId: string) {
    return this.makeRequest('notes', `/${noteId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async updateNote(token: string, noteId: string, title: string, content: string) {
    return this.makeRequest('notes', `/${noteId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    })
  }

  async deleteNote(token: string, noteId: string) {
    return this.makeRequest('notes', `/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Database methods (optional)
  async initDatabase() {
    return this.makeRequest('database', '', {
      method: 'POST',
      body: JSON.stringify({ action: 'init' }),
    })
  }

  async executeSQL(sql: string) {
    return this.makeRequest('database', '', {
      method: 'POST',
      body: JSON.stringify({ sql }),
    })
  }
}

// Create and export the client instance
export const supabaseEdge = new SupabaseEdgeClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
})

export default supabaseEdge
