'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Conversation } from '@elevenlabs/client';
import { Mic, MicOff, Wifi, WifiOff, Clock, User, Bot, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface TranscriptMessage {
  id: string;
  speaker: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ConnectionQuality {
  signal: number; // 0-4 bars
  latency: number; // ms
}

interface VoiceSessionInterfaceProps {
  sessionId: string;
  onSessionEnd: (duration: number, conversationId?: string, transcript?: TranscriptMessage[]) => void;
}

export default function VoiceSessionInterface({ sessionId, onSessionEnd }: VoiceSessionInterfaceProps) {
  // Connection states
  const [conversation, setConversation] = useState<any>(null);
  const [elevenLabsConversationId, setElevenLabsConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>({ signal: 0, latency: 0 });

  // Session states
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [minutesUsed, setMinutesUsed] = useState(0);

  // UI states
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [audioVisualizerLevel, setAudioVisualizerLevel] = useState(0);

  // Refs
  const sessionTimerRef = useRef<NodeJS.Timeout>();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast.error('Microphone permission is required for voice sessions');
      return false;
    }
  }, []);

  // Get signed URL from our backend
  const getSignedUrl = useCallback(async () => {
    try {
      console.log('🔄 Requesting signed URL...');
      const response = await fetch('/api/session/elevenlabs-signed-url');

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Backend error:', error);
        throw new Error(error.message || error.error || 'Failed to get signed URL');
      }

      const data = await response.json();
      console.log('✅ Signed URL obtained from backend', {
        hasConversationId: !!data.conversationId
      });

      // Store conversation ID if provided by ElevenLabs
      if (data.conversationId) {
        setElevenLabsConversationId(data.conversationId);
        console.log('📝 ElevenLabs conversation ID saved:', data.conversationId);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Error getting signed URL:', error);
      toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, []);

  // Start conversation
  const startConversation = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;

      // Real ElevenLabs integration
      console.log('🔄 Getting signed URL from backend...');
      const signedUrl = await getSignedUrl();
      console.log('✅ Signed URL obtained, starting ElevenLabs conversation...');
      
      // Create real ElevenLabs conversation using the official example pattern
      const newConversation = await Conversation.startSession({
        signedUrl: signedUrl,
        onConnect: () => {
          console.log('✅ Connected to ElevenLabs AI');
          setIsConnected(true);
          setIsConnecting(false);
          setIsRecording(true);
          setSessionStartTime(new Date());
          setConnectionQuality({ signal: 4, latency: 50 });
          toast.success('🎉 Connected to live AI trainer! Start speaking.');
          
          // Add initial AI greeting to transcript
          setTranscript([{
            id: Date.now().toString(),
            speaker: 'ai',
            content: 'Hello! I\'m your AI sales trainer powered by ElevenLabs. I\'ll role-play as a potential client. Please start with your opening pitch, and I\'ll respond naturally with questions and objections to help you practice.',
            timestamp: new Date()
          }]);
        },
        onDisconnect: () => {
          console.log('❌ Disconnected from ElevenLabs');
          setIsConnected(false);
          setIsRecording(false);
          setIsSpeaking(false);
          setConnectionQuality({ signal: 0, latency: 0 });

          if (sessionStartTime) {
            const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
            const conversationId = elevenLabsConversationId || newConversation?.getConversationId?.() || `unknown-${Date.now()}`;
            console.log('📝 Disconnected - ending session with conversation ID:', conversationId, 'and', transcript.length, 'messages');
            onSessionEnd(duration, conversationId, transcript);
          }

          toast('Session ended', { icon: '👋' });
        },
        onError: (error) => {
          console.error('❌ ElevenLabs conversation error:', error);
          setIsConnecting(false);
          setIsConnected(false);
          toast.error(`Connection error: ${String(error) || 'Unknown error'}`);
        },
        onModeChange: (mode) => {
          console.log('🔄 ElevenLabs mode changed:', mode);
          const speaking = mode?.mode === 'speaking';
          setIsSpeaking(speaking);
          
          // Update audio visualizer based on mode
          if (speaking) {
            setAudioVisualizerLevel(Math.random() * 0.8 + 0.2); // Dynamic level
          } else {
            setAudioVisualizerLevel(0.1);
          }
        },
        onMessage: (message) => {
          // Collect real transcript data from ElevenLabs
          console.log('📝 New message received:', message);
          
          if (message && typeof message === 'object') {
            const content = message.message || String(message);
            const speaker = message.source === 'ai' ? 'ai' : 'user';
            
            setTranscript(prev => [...prev, {
              id: `${Date.now()}-${Math.random()}`,
              speaker,
              content,
              timestamp: new Date()
            }]);
          }
        }
      });
      
      setConversation(newConversation);
      
    } catch (error) {
      setIsConnecting(false);
      console.error('Error starting conversation:', error);
      toast.error('Demo: Connection simulation failed');
    }
  }, [requestMicrophonePermission, getSignedUrl]);

  // End conversation
  const endConversation = useCallback(async () => {
    if (conversation) {
      try {
        console.log('🔄 Ending ElevenLabs conversation...');
        await conversation.endSession();
        console.log('✅ ElevenLabs conversation ended');
      } catch (error) {
        console.error('❌ Error ending conversation:', error);
      }

      setConversation(null);
      setIsConnected(false);
      setIsSpeaking(false);
      setIsRecording(false);
      setConnectionQuality({ signal: 0, latency: 0 });

      if (sessionStartTime) {
        const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        const conversationId = elevenLabsConversationId || conversation?.getConversationId?.() || `unknown-${Date.now()}`;
        console.log('📝 Ending session with conversation ID:', conversationId, 'and', transcript.length, 'messages');
        onSessionEnd(duration, conversationId, transcript);
      }

      toast('Session ended', { icon: '👋' });
    }
  }, [conversation, sessionStartTime, transcript, elevenLabsConversationId, onSessionEnd]);

  // Session timer
  useEffect(() => {
    if (isConnected && sessionStartTime) {
      sessionTimerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - sessionStartTime.getTime();
        setElapsed(elapsedMs);
        setMinutesUsed(Math.ceil(elapsedMs / (1000 * 60)));
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isConnected, sessionStartTime]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Format elapsed time
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Signal strength bars
  const renderSignalBars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-gray-300 rounded-sm transition-colors duration-200 ${
              i < connectionQuality.signal
                ? connectionQuality.signal >= 3 ? 'bg-green-500' : 'bg-yellow-500'
                : 'bg-gray-300'
            }`}
            style={{
              height: `${8 + i * 2}px`
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main transcript area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 pb-32">
          <AnimatePresence>
            {transcript.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex mb-4 ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.speaker === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm border'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    {message.speaker === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-75">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        {/* Sheet header - always visible for toggle */}
        <div 
          className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setSheetExpanded(!sheetExpanded)}
        >
          <div className="flex items-center space-x-4">
            {/* Connection status */}
            <div className="flex items-center space-x-2">
              {renderSignalBars()}
              <span className="text-xs text-gray-600">
                {connectionQuality.latency}ms
              </span>
            </div>
            
            {/* Session timer */}
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-mono text-gray-800">
                {formatTime(elapsed)}
              </span>
            </div>
            
            {/* Minutes used */}
            <div className="text-sm text-gray-600">
              {minutesUsed} min used
            </div>
          </div>

          {/* Expand/collapse indicator */}
          <motion.div
            animate={{ rotate: sheetExpanded ? 180 : 0 }}
            className="w-4 h-4 border-b-2 border-gray-600"
            style={{ borderTop: '2px solid transparent' }}
          />
        </div>

        {/* Sheet content */}
        <motion.div
          initial={false}
          animate={{ 
            height: sheetExpanded ? 'auto' : 0,
            opacity: sheetExpanded ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="p-6">
              {/* Main microphone control */}
              <div className="flex flex-col items-center space-y-4">
                {/* Microphone button with audio visualizer */}
                <div className="relative">
                  {/* Progress ring */}
                  <svg className="w-32 h-32 -rotate-90 absolute inset-0" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - (minutesUsed % 60) / 60)}`}
                      className="text-blue-500 transition-all duration-1000"
                    />
                  </svg>

                  {/* Microphone button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isConnected ? endConversation : startConversation}
                    disabled={isConnecting}
                    className={`relative z-10 w-32 h-32 rounded-full shadow-lg transition-colors duration-200 ${
                      isConnected
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isConnecting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"
                      />
                    ) : isConnected ? (
                      <MicOff className="w-8 h-8 mx-auto" />
                    ) : (
                      <Mic className="w-8 h-8 mx-auto" />
                    )}
                    
                    {/* Audio visualizer */}
                    {isConnected && (
                      <motion.div
                        animate={{
                          scale: isSpeaking ? [1, 1.1, 1] : 1,
                          opacity: isSpeaking ? [0.7, 1, 0.7] : 0.7
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: isSpeaking ? Infinity : 0
                        }}
                        className="absolute inset-0 rounded-full border-4 border-white opacity-30"
                      />
                    )}
                  </motion.button>
                </div>

                {/* Status text */}
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-800">
                    {isConnecting
                      ? 'Connecting...'
                      : isConnected
                      ? isSpeaking
                        ? 'AI is speaking...'
                        : 'Listening...'
                      : 'Start Voice Session'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {isConnected
                      ? 'Tap to end session'
                      : 'Tap to begin practicing'
                    }
                  </p>
                </div>
              </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
