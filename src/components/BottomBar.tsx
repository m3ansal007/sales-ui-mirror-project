import { Calendar, ChevronDown, Mic, Send, Plus, Search, MicOff } from "lucide-react";
import { useState, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import { sendChatMessage } from "@/services/chatService";
import { useToast } from "@/hooks/use-toast";
import { useColors } from "@/contexts/ColorContext";
import { VoiceRecorder } from "@/utils/voiceRecorder";
import { convertSpeechToText } from "@/services/speechService";
import { useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useLeads";

export const BottomBar = () => {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const { addMessage, setLoading, isLoading, messages } = useChat();
  const { updateColors } = useColors();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createLead } = useLeads();

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    try {
      // Get conversation history (last 10 messages to avoid token limits)
      const conversationHistory = messages.slice(-10);
      
      const response = await sendChatMessage(userMessage, conversationHistory);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Handle color changes if requested
      if (response.colorAction) {
        updateColors({
          primaryColor: response.colorAction.colors.primary,
          secondaryColor: response.colorAction.colors.secondary,
          accentColor: response.colorAction.colors.accent
        });
        
        toast({
          title: "Colors Updated",
          description: "The UI colors have been changed as requested!",
        });
      }

      // Handle lead creation if requested
      if (response.leadAction) {
        console.log('AI wants to create lead:', response.leadAction);
        
        const leadData = {
          ...response.leadAction.leadData,
          status: response.leadAction.leadData.status || 'New'
        };
        
        console.log('Processed lead data:', leadData);
        
        const success = await createLead(leadData);
        console.log('Lead creation result:', success);
        
        if (success) {
          toast({
            title: "Lead Created Successfully",
            description: `Added ${leadData.name} to your leads!`,
          });
          
          // Trigger page refresh to show updated lead count
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          console.error('Failed to create lead through AI');
          toast({
            title: "Lead Creation Failed",
            description: "Unable to create the lead. Please try manually.",
            variant: "destructive",
          });
        }
      }

      // Add assistant response to chat
      addMessage({ role: 'assistant', content: response.message });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      try {
        setIsProcessingVoice(true);
        
        if (voiceRecorderRef.current) {
          const audioBlob = await voiceRecorderRef.current.stopRecording();
          console.log('Audio recording stopped, converting to text...');
          
          const speechResult = await convertSpeechToText(audioBlob);
          
          if (speechResult.error) {
            toast({
              title: "Voice Error",
              description: speechResult.error,
              variant: "destructive",
            });
          } else if (speechResult.text.trim()) {
            setInput(speechResult.text);
            toast({
              title: "Voice Recognized",
              description: "Speech converted to text successfully!",
            });
          } else {
            toast({
              title: "No Speech Detected",
              description: "Please try speaking again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Voice input error:', error);
        toast({
          title: "Voice Error",
          description: "Failed to process voice input. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsRecording(false);
        setIsProcessingVoice(false);
        voiceRecorderRef.current = null;
      }
    } else {
      // Start recording
      try {
        voiceRecorderRef.current = new VoiceRecorder();
        await voiceRecorderRef.current.startRecording();
        setIsRecording(true);
        
        toast({
          title: "Recording Started",
          description: "Speak now... Click the mic again to stop.",
        });
      } catch (error) {
        console.error('Failed to start recording:', error);
        toast({
          title: "Microphone Error",
          description: "Failed to access microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "Add Lead":
        navigate('/leads');
        // Add a message to trigger the add lead modal
        setTimeout(() => {
          const addButton = document.querySelector('[data-testid="add-lead-button"]') as HTMLButtonElement;
          if (addButton) {
            addButton.click();
          } else {
            // Fallback: send AI message to add lead
            setInput("Add a new lead");
          }
        }, 100);
        break;
      case "Follow-ups":
        navigate('/tasks?filter=Due Today');
        break;
      case "Search":
        // Focus on the search input
        const searchInput = document.querySelector('input[placeholder*="Ask AI"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.placeholder = "Search leads, tasks, or ask AI...";
        }
        break;
      default:
        break;
    }
  };

  const quickActions = [
    { label: "Add Lead", icon: Plus },
    { label: "Follow-ups", icon: Calendar },
    { label: "Search", icon: Search }
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {quickActions.map((action, index) => (
            <button 
              key={index}
              onClick={() => handleQuickAction(action.label)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-2 text-white transition-colors"
            >
              <action.icon className="w-4 h-4" />
              <span>{action.label}</span>
            </button>
          ))}
          
          <button 
            className={`rounded-full p-3 text-white transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : isProcessingVoice
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            onClick={handleVoiceInput}
            disabled={isProcessingVoice || isLoading}
          >
            {isProcessingVoice ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex-1 max-w-2xl mx-4">
          <div className="bg-slate-800 border border-slate-700 rounded-full px-6 py-3 flex items-center gap-3">
            <input
              type="text"
              placeholder={isRecording ? "Recording..." : isProcessingVoice ? "Processing speech..." : "Ask AI: Add lead, find follow-ups, get summary..."}
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isRecording || isProcessingVoice}
            />
            <button 
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim() || isRecording || isProcessingVoice}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
