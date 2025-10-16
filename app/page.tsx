'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ControlsBar } from '@/components/ControlsBar';
import { MessageDisplay } from '@/components/MessageDisplay';
import { CameraPreview } from '@/components/CameraPreview';
import { TextInput } from '@/components/TextInput';
import { GeminiService } from '@/lib/gemini-service';
import { CameraService } from '@/lib/camera-service';
import { VoiceService } from '@/lib/voice-service';
import { usePreferences } from '@/hooks/usePreferences';
import { generateSessionId, getSystemPrompt, checkBrowserSupport } from '@/lib/utils';
import type { Message, CameraState, AudioState, ConnectionQuality, ViewMode } from '@/types';

export default function Home() {
  // Services
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
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
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
      return;
    }

    // Check browser support
    const support = checkBrowserSupport();
    if (!support.webSocket) {
      console.error('WebSocket not supported');
      return;
    }

    // Initialize Gemini Service
    const gemini = new GeminiService({
      apiKey,
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      systemPrompt: getSystemPrompt('both', 'pre-flight', sessionId),
    });

    gemini.onConnection((isConnected) => {
      setConnected(isConnected);
      setConnectionQuality(isConnected ? 'good' : 'offline');
    });

    gemini.onMessage((response) => {
      setIsProcessing(false);
      addMessage('assistant', response.text, 'text');

      // Speak response if voice is enabled
      if (preferences.voiceEnabled && voiceService) {
        voiceService.speak(response.text);
      }

      // Show as overlay if in camera view
      if (currentView === 'camera') {
        setOverlayMessage(response.text);
        setTimeout(() => setOverlayMessage(''), 5000);
      }
    });

    gemini.onError((error) => {
      console.error('Gemini error:', error);
      setIsProcessing(false);
      setConnectionQuality('poor');
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

      camera.onFrame(() => {
        // Frame capture callback - frames are captured at 1 FPS
        // We don't send frames automatically, only when user initiates interaction
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

    // If camera is active, send both voice and current frame
    if (cameraState === 'active' && cameraService) {
      const frame = cameraService.captureSnapshot();
      if (frame) {
        geminiService.sendMultimodal(transcript, frame);
        return;
      }
    }

    // Otherwise, send just the text
    geminiService.sendText(transcript);
  };

  // Handle text input
  const handleTextInput = (text: string) => {
    if (!geminiService || !connected) return;

    addMessage('user', text, 'text');
    setIsProcessing(true);

    // If camera is active, send both text and current frame
    if (cameraState === 'active' && cameraService) {
      const frame = cameraService.captureSnapshot();
      if (frame) {
        geminiService.sendMultimodal(text, frame);
        return;
      }
    }

    // Otherwise, send just the text
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
