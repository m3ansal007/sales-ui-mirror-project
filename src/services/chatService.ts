
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export const sendChatMessage = async (
  message: string, 
  apiKey: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> => {
  if (!apiKey) {
    return { message: '', error: 'OpenAI API key is required' };
  }

  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for a sales management dashboard. Help users with sales insights, data analysis, and management tasks. Be concise and actionable in your responses.'
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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from ChatGPT');
    }

    const data = await response.json();
    return { 
      message: data.choices[0]?.message?.content || 'No response received' 
    };
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    return { 
      message: '', 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
