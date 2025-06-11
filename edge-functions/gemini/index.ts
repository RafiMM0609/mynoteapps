// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Global Deno declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (request: Request) => Promise<Response>): void;
};

// Type definitions
interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

// Function to perform web search using SerpAPI
async function performWebSearch(query: string): Promise<SearchResult[] | null> {
  try {
    // Using SerpAPI as an example (you can replace with other search APIs)
    const searchApiKey = Deno.env.get('SEARCH_API_KEY');
    
    if (!searchApiKey) {
      console.warn('SEARCH_API_KEY not found, skipping web search');
      return null;
    }

    const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${searchApiKey}&num=3`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.warn('Search API error:', searchResponse.status);
      return null;
    }
    
    const searchData = await searchResponse.json();
    
    // Extract relevant search results
    const results: SearchResult[] = searchData.organic_results?.slice(0, 3).map((result: any) => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link
    })) || [];
    
    return results;
  } catch (error) {
    console.warn('Web search error:', error);
    return null;
  }
}

console.info('Gemini AI edge function started');

Deno.serve(async (req)=>{
  try {
    // Parse the request body
    const { text, enableSearch = false } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({
        error: 'Text parameter is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Get the Gemini API key from environment variables
    const geminiApiKey = 'AIzaSyDQzUbUk0tASoYabp4wQyphtJCeuSjkEYs';
    if (!geminiApiKey) {
      return new Response(JSON.stringify({
        error: 'GEMINI_API_KEY environment variable is not set'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });    }    
    
    // Get search results if enabled
    let searchResults: SearchResult[] | null = null;
    if (enableSearch) {
      searchResults = await performWebSearch(text);
    }

    // Prepare the request payload for Gemini API
    let promptText = text;    if (searchResults && searchResults.length > 0) {
      const searchContext = searchResults.map((result: SearchResult) => 
        `Title: ${result.title}\nSnippet: ${result.snippet}\nSource: ${result.link}`
      ).join('\n\n');
      
      promptText = `Based on the following search results and the user's question, provide a comprehensive answer:

Search Results:
${searchContext}

User Question: ${text}

Please provide a well-informed answer based on the search results above.`;
    }

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: promptText
            }
          ]
        }
      ]
    };
    // Call the Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    });
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({
        error: `Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`,
        details: errorText
      }), {
        status: geminiResponse.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const geminiData = await geminiResponse.json();
    // Extract the text response from Gemini
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';    // Return the formatted response
    const data = {
      message: aiResponse,
      original_text: text,
      search_enabled: enableSearch,
      search_results: searchResults,
      sources_used: searchResults ? searchResults.length : 0,
      timestamp: new Date().toISOString()
    };
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error in Gemini edge function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
