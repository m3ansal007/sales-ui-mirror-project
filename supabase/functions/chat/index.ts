
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

const parseLeadRequest = (message: string) => {
  const leadKeywords = ['add lead', 'create lead', 'new lead', 'add contact', 'create contact'];
  const hasLeadKeyword = leadKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasLeadKeyword) return null;

  // Extract lead information using simple patterns
  const extractField = (pattern: RegExp) => {
    const match = message.match(pattern);
    return match ? match[1].trim() : undefined;
  };

  // Extract email using regex
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  
  // Extract phone using regex (various formats)
  const phoneMatch = message.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  
  // Extract name (look for patterns like "name: John Doe" or "add lead John Doe")
  const namePattern = /(?:name[:\s]+|lead[:\s]+|contact[:\s]+)([A-Za-z\s]+?)(?:\s|$|email|phone|company)/i;
  const nameMatch = message.match(namePattern);
  
  // Extract company
  const companyPattern = /(?:company[:\s]+|at[:\s]+)([A-Za-z0-9\s&.,-]+?)(?:\s|$|email|phone|name)/i;
  const companyMatch = message.match(companyPattern);

  // If we can extract at least a name, create the lead data
  const name = nameMatch ? nameMatch[1].trim() : undefined;
  
  if (name && name.length > 0) {
    return {
      action: 'create_lead',
      leadData: {
        name,
        email: emailMatch ? emailMatch[0] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        company: companyMatch ? companyMatch[1].trim() : undefined,
        source: 'AI Chat',
        status: 'New'
      }
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
    console.log('Color request result:', colorRequest);
    
    // Check if this is a lead creation request
    const leadRequest = parseLeadRequest(message);
    console.log('Lead request result:', leadRequest);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for a sales management dashboard. Help users with sales insights, data analysis, and management tasks. Be concise and actionable in your responses.

IMPORTANT CAPABILITIES:
1. You can change the UI colors when users ask. Supported colors include: red, blue, green, purple, yellow, orange, pink, indigo, teal, cyan, lime, emerald, violet, fuchsia, rose, amber.
2. You can add leads to the system when users provide lead information.

COLOR EXAMPLES:
- "change to blue" or "make it blue" - changes primary color to blue
- "change colors to red" - changes primary color to red

LEAD CREATION EXAMPLES:
- "add lead John Doe email john@example.com phone 555-1234 company ABC Corp" - creates a new lead
- "create contact Sarah Smith at Google with email sarah@google.com" - creates a new lead
- "new lead Mike Johnson phone 555-9876" - creates a lead with available info

When creating leads, acknowledge the action and confirm what information was captured.`
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
      console.log('Including color action in response');
    }
    
    // If this was a lead creation request, include the lead action
    if (leadRequest) {
      responseData.leadAction = leadRequest;
      console.log('Including lead action in response:', leadRequest);
    }

    console.log('Final response data:', responseData);

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
