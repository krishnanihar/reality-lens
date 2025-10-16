'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ControlsBar } from '@/components/ControlsBar';
import { MessageDisplay } from '@/components/MessageDisplay';
import { CameraPreview } from '@/components/CameraPreview';
import { TextInput } from '@/components/TextInput';
import { GeminiLiveClient } from '@/lib/gemini-live-client';
import { CameraService } from '@/lib/camera-service';
import { VoiceService } from '@/lib/voice-service';
import { usePreferences } from '@/hooks/usePreferences';
import { generateSessionId, checkBrowserSupport } from '@/lib/utils';
import type { Message, CameraState, AudioState, ConnectionQuality, ViewMode } from '@/types';

export default function Home() {
  // Services
  const [geminiService, setGeminiService] = useState<GeminiLiveClient | null>(null);
  const [cameraService, setCameraService] = useState<CameraService | null>(null);
  const [voiceService, setVoiceService] = useState<VoiceService | null>(null);

  // State
  const [sessionId] = useState(() => generateSessionId());
  const [connected, setConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('offline');
  const [messages, setMessages] = useState<Message[]>([]);
  const [cameraState, setCameraState] = useState<CameraState>('inactive');
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [currentView] = useState<ViewMode>('camera'); // setCurrentView will be used in Phase 2
  const [overlayMessage, setOverlayMessage] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { preferences } = usePreferences();

  // Initialize services
  useEffect(() => {
    console.log('Initializing Reality Lens...');

    // Check browser support
    const support = checkBrowserSupport();
    if (!support.webSocket) {
      console.error('WebSocket not supported');
      return;
    }

    // Initialize Gemini Live Client
    // Connects to local backend server which proxies to Gemini Live API
    const serverUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:3001';
    console.log('Connecting to WebSocket server:', serverUrl);

    const gemini = new GeminiLiveClient({
      serverUrl,
      onConnection: (isConnected) => {
        console.log('Gemini Live connection status:', isConnected ? 'Connected ✅' : 'Disconnected ❌');
        setConnected(isConnected);
        setConnectionQuality(isConnected ? 'good' : 'offline');
        if (isConnected) {
          addMessage('assistant', 'Hello! I\'m Reality Lens AI with live vision. I can see what you see in real-time. How can I help you today?', 'text');
        }
      },
      onResponse: (text, audio) => {
        setIsProcessing(false);

        if (text) {
          addMessage('assistant', text, 'text');

          // Speak response if voice is enabled
          if (preferences.voiceEnabled && voiceService) {
            // If we have audio from Gemini, use that, otherwise use local TTS
            if (audio) {
              // TODO: Play audio from Gemini
              console.log('Received audio from Gemini (playback not implemented yet)');
              voiceService.speak(text); // Fallback to local TTS for now
            } else {
              voiceService.speak(text);
            }
          }

          // Show as overlay if in camera view
          if (currentView === 'camera') {
            setOverlayMessage(text);
            setTimeout(() => setOverlayMessage(''), 5000);
          }
        }
      },
      onError: (error) => {
        console.error('Gemini Live error:', error);
        setIsProcessing(false);
        setConnectionQuality('poor');
        // Show error to user
        addMessage('assistant', `Connection error: ${error}. Please check the server connection.`, 'text');
      },
    });

    // Connect to server
    gemini.connect().catch((error) => {
      console.error('Failed to connect to server:', error);
      setConnectionQuality('offline');
      addMessage('assistant', 'Failed to connect to Reality Lens server. Please make sure the backend server is running.', 'text');
    });

    setGeminiService(gemini);

    // Initialize Camera Service
    let camera: CameraService | null = null;
    if (support.camera) {
      camera = new CameraService({
        resolution: { width: 640, height: 480 },
        frameRate: 1,
        quality: 0.7,
        facingMode: 'environment',
      });

      camera.onState((state) => {
        setCameraState(state);
      });

      camera.onFrame((frameData) => {
        // Frame capture callback - frames are captured at 1 FPS
        // Send frames continuously to Gemini Live when camera is active
        if (gemini && frameData) {
          gemini.sendVideoFrame(frameData);
        }
      });

      camera.onError((error) => {
        console.error('Camera error:', error);
      });

      setCameraService(camera);
    }

    // Initialize Voice Service
    let voice: VoiceService | null = null;
    if (support.speech && support.speechSynthesis) {
      voice = new VoiceService({
        language: preferences.language,
        continuous: preferences.continuousListening,
        interimResults: true,
        maxAlternatives: 1,
      });

      voice.onState((state) => {
        setAudioState(state);
      });

      voice.onTranscript((transcript, isFinal) => {
        if (isFinal && transcript.trim()) {
          addMessage('user', transcript, 'voice');
          handleVoiceInput(transcript);
        }
      });

      voice.onError((error) => {
        console.error('Voice error:', error);
      });

      setVoiceService(voice);
    }

    // Cleanup
    return () => {
      gemini.disconnect();
      camera?.stop();
      voice?.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Add message to conversation
  const addMessage = (role: 'user' | 'assistant', content: string, type: Message['type']) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      role,
      content,
      timestamp: Date.now(),
      type,
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage];
      // Keep only last 50 messages
      return updated.slice(-50);
    });
  };

  // Handle voice input
  const handleVoiceInput = (transcript: string) => {
    if (!geminiService || !connected) return;

    setIsProcessing(true);

    // With Gemini Live, we're already streaming video frames
    // Just send the text prompt - Gemini will correlate it with the video stream
    geminiService.sendText(transcript);
  };

  // Handle text input
  const handleTextInput = (text: string) => {
    if (!geminiService || !connected) return;

    addMessage('user', text, 'text');
    setIsProcessing(true);

    // With Gemini Live, we're already streaming video frames
    // Just send the text prompt - Gemini will correlate it with the video stream
    geminiService.sendText(text);
  };

  // Toggle camera
  const handleCameraToggle = async () => {
    if (!cameraService) return;

    if (cameraState === 'active') {
      cameraService.stop();
      setVideoElement(null);
    } else {
      await cameraService.start(preferences.preferredCamera);
      const video = cameraService.getVideoElement();
      setVideoElement(video);
    }
  };

  // Toggle microphone
  const handleMicToggle = () => {
    if (!voiceService) return;

    if (audioState === 'listening') {
      voiceService.stopListening();
    } else {
      voiceService.startListening();
    }
  };

  // Toggle keyboard
  const handleKeyboardToggle = () => {
    setShowTextInput(!showTextInput);
  };

  // Settings
  const handleSettings = () => {
    // TODO: Implement settings modal
    alert('Settings coming soon!');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black">
      {/* Header */}
      <Header
        connected={connected}
        connectionQuality={connectionQuality}
        onSettingsClick={handleSettings}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-14 pb-20 overflow-hidden">
        {currentView === 'camera' && (
          <CameraPreview
            videoElement={videoElement}
            cameraState={cameraState}
            overlayMessage={overlayMessage}
          />
        )}

        {currentView === 'chat' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <MessageDisplay messages={messages} />
            </div>
            {showTextInput && (
              <div className="p-4">
                <TextInput onSend={handleTextInput} disabled={!connected} />
              </div>
            )}
          </div>
        )}

        {currentView === 'combined' && (
          <div className="h-full grid grid-rows-2">
            <div className="overflow-hidden">
              <CameraPreview
                videoElement={videoElement}
                cameraState={cameraState}
                overlayMessage={overlayMessage}
              />
            </div>
            <div className="overflow-hidden border-t border-gray-800">
              <MessageDisplay messages={messages} />
            </div>
          </div>
        )}
      </main>

      {/* Controls */}
      <ControlsBar
        cameraState={cameraState}
        audioState={audioState}
        onCameraToggle={handleCameraToggle}
        onMicToggle={handleMicToggle}
        onKeyboardToggle={handleKeyboardToggle}
      />

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 glass-effect px-4 py-2 rounded-full z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm">Processing...</span>
          </div>
        </div>
      )}

      {/* Text Input Overlay */}
      {showTextInput && currentView === 'camera' && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-30">
          <TextInput onSend={handleTextInput} disabled={!connected} />
        </div>
      )}
    </div>
  );
}
