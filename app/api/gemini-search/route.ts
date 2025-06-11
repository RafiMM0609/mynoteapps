import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, enableSearch = false } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Call Supabase Edge Function
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/gemini`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        text,
        enableSearch,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', errorText);
      
      return NextResponse.json(
        { 
          error: `Edge function error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the response from edge function
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: 'Gemini Search API is running',
    endpoints: {
      POST: '/api/gemini-search',
      description: 'Send text with optional search enabled'
    },
    example: {
      text: 'Your question here',
      enableSearch: true
    }
  });
}
