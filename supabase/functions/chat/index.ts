
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
}

const parseColorRequest = (message: string) => {
  const colorKeywords = ['color', 'colors', 'theme', 'change', 'update'];
  const hasColorKeyword = colorKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (!hasColorKeyword) return null;

  const colorMap: { [key: string]: string } = {
    'red': 'red', 'blue': 'blue', 'green': 'green', 'purple': 'purple',
    'yellow': 'yellow', 'orange': 'orange', 'pink': 'pink', 'indigo': 'indigo',
    'teal': 'teal', 'cyan': 'cyan', 'lime': 'lime', 'emerald': 'emerald',
    'violet': 'violet', 'fuchsia': 'fuchsia', 'rose': 'rose', 'amber': 'amber'
  };

  const extractedColors: { [key: string]: string } = {};
  
  for (const [colorName, colorValue] of Object.entries(colorMap)) {
    if (message.toLowerCase().includes(colorName)) {
      extractedColors.primary = colorValue;
      break;
    }
  }

  if (Object.keys(extractedColors).length > 0) {
    return {
      action: 'change_colors',
      colors: extractedColors
    };
  }

  return null;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { message, conversationHistory }: ChatRequest = await req.json();

    console.log('Processing chat request:', { message, historyLength: conversationHistory.length });

    // Check if this is a color change request
    const colorRequest = parseColorRequest(message);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for a sales management dashboard. Help users with sales insights, data analysis, and management tasks. Be concise and actionable in your responses.

IMPORTANT: You can change the UI colors when users ask. If someone asks to change colors, acknowledge their request and explain that you're updating the colors. Supported colors include: red, blue, green, purple, yellow, orange, pink, indigo, teal, cyan, lime, emerald, violet, fuchsia, rose, amber.

Examples:
- "change to blue" or "make it blue" - changes primary color to blue
- "change colors to red" - changes primary color to red
- "update the theme to purple" - changes primary color to purple`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get response from ChatGPT');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'No response received';

    console.log('ChatGPT response received successfully');

    const responseData: any = { 
      message: assistantMessage 
    };

    // If this was a color change request, include the color action
    if (colorRequest) {
      responseData.colorAction = colorRequest;
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
