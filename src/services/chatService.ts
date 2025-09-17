
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  error?: string;
  colorAction?: {
    action: 'change_colors';
    colors: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  };
  leadAction?: {
    action: 'create_lead';
    leadData: {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      source?: string;
      status?: string;
      notes?: string;
      value?: number;
    };
  };
}

export const sendChatMessage = async (
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    console.log('Sending chat message to backend:', message);

    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        message,
        conversationHistory
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to get response from chat service');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return { 
      message: data.message || 'No response received',
      colorAction: data.colorAction,
      leadAction: data.leadAction
    };
  } catch (error) {
    console.error('Chat Service Error:', error);
    return { 
      message: '', 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
