
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatMessage } from '@/services/chatService';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKeyState] = useState(() => {
    return localStorage.getItem('openai_api_key') || '';
  });

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('openai_api_key', key);
  };

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      apiKey,
      setApiKey,
      addMessage,
      setLoading,
      clearMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
