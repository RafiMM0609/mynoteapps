// CORS headers definition
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};
// Supabase Edge Function handler
Deno.serve(async (req)=>{
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { method } = req;
    if (method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const body = await req.json();
    // Check if this is a Telegram webhook (has update_id)
    if (body.update_id !== undefined) {
      return await handleWebhook(body);
    }
    // Otherwise, handle as API call with action parameter
    const { action, ...params } = body;
    switch(action){
      case 'send_message':
        return await sendMessage(params);
      case 'send_notification':
        return await sendNotification(params);
      case 'webhook':
        return await handleWebhook(params);
      default:
        return new Response(JSON.stringify({
          error: 'Invalid action'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
    }
  } catch (error) {
    console.error('Telegram function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
// Function to call Gemini API
async function callGeminiAPI(text) {
  try {
    const geminiResponse = await fetch('https://livlimcygmeebknjkbuq.supabase.co/functions/v1/gemini', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdmxpbWN5Z21lZWJrbmprYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxODMyMzQsImV4cCI6MjA0Nzc1OTIzNH0.vNUVvjDmf4XW-lv5GJR80ImcQvEHr8h5j3fSFBB8n6A',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text
      })
    });
    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }
    const geminiResult = await geminiResponse.json();
    return geminiResult;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
async function sendMessage(params) {
  // Get bot token from environment variables (recommended for production)
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '7869151175:AAFm4UQYmkjNBmhoh60HRzehEjYoPhlKvhw';
  if (!botToken) {
    return new Response(JSON.stringify({
      error: 'Telegram bot token not configured'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  const { chat_id, text, parse_mode = 'HTML', ...options } = params;
  if (!chat_id || !text) {
    return new Response(JSON.stringify({
      error: 'chat_id and text are required'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode,
        ...options
      })
    });
    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Message sent successfully',
      telegram_response: result.result
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return new Response(JSON.stringify({
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
async function sendNotification(params) {
  const { user_id, title, message, type = 'info' } = params;
  if (!user_id || !message) {
    return new Response(JSON.stringify({
      error: 'user_id and message are required'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  // Get user's Telegram chat_id from database (you'll need to implement this)
  // For now, using user_id as chat_id
  const chat_id = user_id;
  const emoji = type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  const text = title ? `${emoji} <b>${title}</b>\n\n${message}` : `${emoji} ${message}`;
  return await sendMessage({
    chat_id,
    text
  });
}
function markdownToHTML(text) {
  return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>').replace(/```([\s\S]*?)```/g, '<pre>$1</pre>').replace(/`(.*?)`/g, '<code>$1</code>');
}
async function handleWebhook(params) {
  try {
    // Validate webhook data
    if (!params || typeof params !== 'object') {
      return new Response(JSON.stringify({
        error: 'Invalid webhook data'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Received Telegram webhook:', JSON.stringify(params, null, 2));
    // Process the update (message, callback query, etc.)
    if (params.message) {
      const message = params.message;
      const chat_id = message.chat.id;
      const text = message.text;
      const user = message.from;
      console.log(`Message from ${user?.username || user?.first_name || 'Unknown'}: ${text}`);
      // Handle different commands
      if (text) {
        if (text.startsWith('/start')) {
          await sendMessage({
            chat_id,
            text: `👋 Halo ${user?.first_name || 'there'}! Selamat datang di bot AI kami.\n\nKirim pesan apapun dan saya akan menjawabnya menggunakan AI Gemini!\n\nKetik /help untuk melihat perintah lainnya.`
          });
        } else if (text.startsWith('/help')) {
          await sendMessage({
            chat_id,
            text: `🤖 <b>Daftar Perintah:</b>\n\n/start - Memulai bot\n/help - Menampilkan bantuan\n/info - Informasi tentang bot\n\nAtau kirim pesan biasa dan saya akan menjawabnya dengan AI! 🚀`
          });
        } else if (text.startsWith('/info')) {
          await sendMessage({
            chat_id,
            text: `ℹ️ <b>Informasi Bot:</b>\n\n🤖 Bot Telegram AI dengan Gemini\n📅 Dibuat: 2025\n⚡ Runtime: Deno Edge Functions\n🧠 AI: Google Gemini\n\nBot ini menggunakan AI Gemini untuk menjawab pertanyaan Anda!`
          });
        } else {
          // Handle regular messages - send to Gemini API
          try {
            // Get bot token for typing action
            const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '7869151175:AAFm4UQYmkjNBmhoh60HRzehEjYoPhlKvhw';
            // Send "typing" action to show bot is processing
            await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                chat_id,
                action: 'typing'
              })
            });
            // Call Gemini API with user's message
            const geminiResponse = await callGeminiAPI(text);
            // Extract the response text from Gemini
            let responseText = '';
            if (geminiResponse && geminiResponse.text) {
              responseText = geminiResponse.text;
            } else if (geminiResponse && geminiResponse.response) {
              responseText = geminiResponse.response;
            } else if (geminiResponse && geminiResponse.message) {
              responseText = geminiResponse.message;
            } else if (typeof geminiResponse === 'string') {
              responseText = geminiResponse;
            } else {
              responseText = 'Maaf, saya tidak dapat memahami respons dari AI. Silakan coba lagi.';
            }
            // Send Gemini's response back to user
            await sendMessage({
              chat_id,
              text: `<b>😁Rafi Ai</b>\n${markdownToHTML(responseText)}`,
              parse_mode: 'HTML'
            });
          } catch (error) {
            console.error('Error processing message with Gemini:', error);
            // Send error message to user
            await sendMessage({
              chat_id,
              text: `❌ Maaf, terjadi kesalahan saat memproses pesan Anda:\n\n<i>${error.message}</i>\n\nSilakan coba lagi dalam beberapa saat.`,
              parse_mode: 'HTML'
            });
          }
        }
      }
    }
    // Handle callback queries (inline keyboard buttons)
    if (params.callback_query) {
      const callback = params.callback_query;
      const chat_id = callback.message?.chat?.id;
      const data = callback.data;
      if (chat_id && data) {
        await sendMessage({
          chat_id,
          text: `🔘 Anda menekan tombol: ${data}`
        });
      }
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Webhook handling error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
