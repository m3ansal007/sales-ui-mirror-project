
export interface SpeechToTextResponse {
  text: string;
  error?: string;
}

export const convertSpeechToText = async (audioBlob: Blob): Promise<SpeechToTextResponse> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Convert blob to base64
    const reader = new FileReader();
    const base64Audio = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    console.log('Converting speech to text...');

    const { data, error } = await supabase.functions.invoke('speech-to-text', {
      body: {
        audio: base64Audio
      }
    });

    if (error) {
      console.error('Speech-to-text error:', error);
      throw new Error(error.message || 'Failed to convert speech to text');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return { text: data.text || '' };
  } catch (error) {
    console.error('Speech Service Error:', error);
    return { 
      text: '', 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
