
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X } from 'lucide-react';

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
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);

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
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      
      // Connect to WebSocket
      const projectId = window.location.hostname.split('.')[0]; // Extract from current URL
      wsRef.current = new WebSocket(`wss://${projectId}.functions.supabase.co/realtime-assistant`);
      
      wsRef.current.onopen = () => {
        console.log('Connected to voice assistant');
        setIsConnected(true);
      };

      wsRef.current.onmessage = handleWebSocketMessage;
      
      wsRef.current.onclose = () => {
        console.log('Disconnected from voice assistant');
        setIsConnected(false);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      // Set up audio recording
      await setupAudioRecording();
      
    } catch (error) {
      console.error('Failed to initialize voice assistant:', error);
    }
  };

  const setupAudioRecording = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      recorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Convert to base64 and send
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

    } catch (error) {
      console.error('Failed to setup audio recording:', error);
    }
  };

  const handleWebSocketMessage = async (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    console.log('Received message:', data.type);

    switch (data.type) {
      case 'session.created':
        // Send session configuration
        wsRef.current?.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful AI assistant. Be friendly, concise, and helpful. Introduce yourself when you first connect.',
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
        // Start the conversation
        wsRef.current?.send(JSON.stringify({
          type: 'response.create'
        }));
        break;

      case 'response.audio.delta':
        if (data.delta && audioQueueRef.current) {
          // Convert base64 to Uint8Array
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
        setAssistantResponse(prev => prev + data.delta);
        break;

      case 'response.audio.done':
        setIsAssistantSpeaking(false);
        break;

      case 'response.done':
        setAssistantResponse('');
        break;

      case 'input_audio_buffer.speech_started':
        setIsRecording(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsRecording(false);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        setTranscript(data.transcript);
        break;
    }
  };

  const startRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'inactive') {
      recorderRef.current.start(100); // Send chunks every 100ms
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  const cleanup = () => {
    stopRecording();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
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
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isAssistantSpeaking ? 'bg-green-600 animate-pulse' : 
              isRecording ? 'bg-blue-600 animate-pulse' : 
              isConnected ? 'bg-slate-600' : 'bg-red-600'
            }`}>
              {isConnected ? (
                isRecording ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />
              ) : (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            
            <div className="text-sm text-slate-300">
              {!isConnected ? 'Connecting...' :
               isAssistantSpeaking ? 'Assistant is speaking...' :
               isRecording ? 'Listening...' : 'Ready to chat'}
            </div>
          </div>

          {isConnected && (
            <div className="space-y-2">
              <Button
                className="w-full"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isAssistantSpeaking}
              >
                {isRecording ? 'Release to stop' : 'Hold to speak'}
              </Button>
              
              {transcript && (
                <div className="bg-slate-700 p-2 rounded text-sm">
                  <strong>You:</strong> {transcript}
                </div>
              )}
              
              {assistantResponse && (
                <div className="bg-green-800 p-2 rounded text-sm">
                  <strong>Assistant:</strong> {assistantResponse}
                </div>
              )}
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
      this.playNext(); // Continue with next segment
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Convert bytes to 16-bit samples
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    // Create WAV header
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

    // Write WAV header
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

    // Combine header and data
    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }
}
