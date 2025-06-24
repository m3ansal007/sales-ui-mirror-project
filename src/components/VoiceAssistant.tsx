
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      initializeAssistant();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isOpen]);

  const initializeAssistant = async () => {
    try {
      setConnectionStatus('Connecting...');
      
      // Initialize audio context first
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      
      // Connect to WebSocket with proper URL
      const supabaseUrl = 'https://uuymgkqkvwixukutvabw.supabase.co';
      const wsUrl = `${supabaseUrl.replace('https://', 'wss://')}/functions/v1/realtime-assistant`;
      
      console.log('Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Connected to voice assistant');
        setIsConnected(true);
        setConnectionStatus('Connected');
        
        toast({
          title: "Connected",
          description: "AI voice assistant is ready to chat!",
        });
      };

      wsRef.current.onmessage = handleWebSocketMessage;
      
      wsRef.current.onclose = (event) => {
        console.log('Disconnected from voice assistant', event);
        setIsConnected(false);
        setConnectionStatus('Disconnected');
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setConnectionStatus('Connection failed');
        
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice assistant. Please try again.",
          variant: "destructive",
        });
      };

      // Set up audio recording after WebSocket is established
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          setupAudioRecording();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize voice assistant:', error);
      setConnectionStatus('Initialization failed');
      
      toast({
        title: "Initialization Error",
        description: "Failed to initialize voice assistant.",
        variant: "destructive",
      });
    }
  };

  const setupAudioRecording = async () => {
    try {
      console.log('Setting up audio recording...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Audio stream obtained successfully');

      recorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('Sending audio data to server');
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            wsRef.current?.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio
            }));
          };
          reader.readAsDataURL(event.data);
        }
      };

      toast({
        title: "Microphone Ready",
        description: "You can now talk to the AI assistant!",
      });

    } catch (error) {
      console.error('Failed to setup audio recording:', error);
      
      let errorMessage = 'Failed to access microphone.';
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please check your device has a microphone.';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone permissions.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Your browser does not support audio recording.';
        }
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleWebSocketMessage = async (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received message:', data.type);

      switch (data.type) {
        case 'session.created':
          console.log('Session created, configuring...');
          wsRef.current?.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: 'You are a helpful AI assistant. Be friendly, concise, and helpful. Speak naturally and conversationally.',
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              temperature: 0.8,
              max_response_output_tokens: 1000
            }
          }));
          break;

        case 'session.updated':
          console.log('Session updated, starting conversation...');
          wsRef.current?.send(JSON.stringify({
            type: 'response.create'
          }));
          break;

        case 'response.audio.delta':
          if (data.delta && audioQueueRef.current) {
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            await audioQueueRef.current.addToQueue(bytes);
            setIsAssistantSpeaking(true);
          }
          break;

        case 'response.audio_transcript.delta':
          setAssistantResponse(prev => prev + (data.delta || ''));
          break;

        case 'response.audio.done':
          setIsAssistantSpeaking(false);
          break;

        case 'response.done':
          setAssistantResponse('');
          break;

        case 'input_audio_buffer.speech_started':
          console.log('Speech detected');
          setIsRecording(true);
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('Speech stopped');
          setIsRecording(false);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          console.log('Transcription completed:', data.transcript);
          setTranscript(data.transcript || '');
          break;

        default:
          console.log('Unhandled message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  const startRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'inactive') {
      console.log('Starting manual recording...');
      recorderRef.current.start(100);
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      console.log('Stopping manual recording...');
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cleanup = () => {
    console.log('Cleaning up voice assistant...');
    
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
    setIsAssistantSpeaking(false);
    setTranscript('');
    setAssistantResponse('');
    setConnectionStatus('Disconnected');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>AI Voice Assistant</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Talk to your AI assistant in real-time
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
              isAssistantSpeaking ? 'bg-green-600 animate-pulse scale-110' : 
              isRecording ? 'bg-blue-600 animate-pulse scale-105' : 
              isConnected ? 'bg-slate-600' : 'bg-red-600'
            }`}>
              {isConnected ? (
                isRecording ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />
              ) : (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            
            <div className="text-sm text-slate-300 mb-2">
              Status: {connectionStatus}
            </div>
            
            <div className="text-xs text-slate-400">
              {!isConnected ? 'Establishing connection...' :
               isAssistantSpeaking ? 'AI is speaking...' :
               isRecording ? 'Listening to you...' : 'Ready to chat - hold to speak'}
            </div>
          </div>

          {isConnected && (
            <div className="space-y-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isAssistantSpeaking || !streamRef.current}
              >
                {isRecording ? 'Release to stop talking' : 'Hold to speak'}
              </Button>
              
              {transcript && (
                <div className="bg-slate-700 p-3 rounded text-sm">
                  <strong className="text-blue-300">You said:</strong>
                  <div className="mt-1">{transcript}</div>
                </div>
              )}
              
              {assistantResponse && (
                <div className="bg-green-800 p-3 rounded text-sm">
                  <strong className="text-green-300">AI is saying:</strong>
                  <div className="mt-1">{assistantResponse}</div>
                </div>
              )}
            </div>
          )}

          {!isConnected && (
            <div className="text-center text-sm text-slate-400">
              <div>Make sure you have:</div>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Allowed microphone permissions</li>
                <li>A working internet connection</li>
                <li>OpenAI API key configured</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Audio Queue class for sequential playback
class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }
}
