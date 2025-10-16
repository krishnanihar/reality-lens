'use client';

import { useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Header } from '@/components/Header';
import { ControlsBar } from '@/components/ControlsBar';
import { MessageDisplay } from '@/components/MessageDisplay';
import { CameraPreview } from '@/components/CameraPreview';
import { TextInput } from '@/components/TextInput';
import ARCanvas from '@/components/ar/ARCanvas';
import { NavigationArrowGroup } from '@/components/ar/NavigationArrow';
import LanguageSelector from '@/components/i18n/LanguageSelector';
import ScanLineEffect from '@/components/effects/ScanLineEffect';
import { GeminiLiveClient } from '@/lib/gemini-live-client';
import { CameraService } from '@/lib/camera-service';
import { VoiceService } from '@/lib/voice-service';
import { usePreferences } from '@/hooks/usePreferences';
import useAR from '@/hooks/useAR';
import i18n from '@/lib/i18n';
import { generateSessionId, checkBrowserSupport } from '@/lib/utils';
import type { Message, CameraState, AudioState, ConnectionQuality, ViewMode, Language } from '@/types';

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
  const [currentView] = useState<ViewMode>('camera');
  const [overlayMessage, setOverlayMessage] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en-US' as Language);

  const { preferences } = usePreferences();

  // Phase 2: AR System
  const {
    detectedObjects,
    navigationArrows,
    config: arConfig,
    setAREnabled,
    processGeminiResponse,
  } = useAR({
    enabled: true,
    maxObjects: 10,
    minConfidence: 0.6,
    performanceMode: 'medium',
  });

  // Initialize services
  useEffect(() => {
    console.log('Initializing Reality Lens Phase 2...');

    // Check browser support
    const support = checkBrowserSupport();
    if (!support.webSocket) {
      console.error('WebSocket not supported');
      return;
    }

    // Initialize Gemini Live Client
    const serverUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:3001';
    console.log('Connecting to WebSocket server:', serverUrl);

    const gemini = new GeminiLiveClient({
      serverUrl,
      onConnection: (isConnected) => {
        console.log('Gemini Live connection status:', isConnected ? 'Connected ✅' : 'Disconnected ❌');
        setConnected(isConnected);
        setConnectionQuality(isConnected ? 'good' : 'offline');
        if (isConnected) {
          addMessage('assistant', 'Hello! I\'m Reality Lens AI with live vision and AR. I can see what you see and show you overlays. How can I help you today?', 'text');
        }
      },
      onResponse: (text, audio, rawResponse) => {
        setIsProcessing(false);

        // Phase 2: Process AR data from response
        if (rawResponse) {
          processGeminiResponse(rawResponse);
        }

        if (text) {
          addMessage('assistant', text, 'text');

          // Speak response if voice is enabled
          if (preferences.voiceEnabled && voiceService) {
            if (audio) {
              console.log('Received audio from Gemini (playback not implemented yet)');
              voiceService.speak(text);
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
        addMessage('assistant', `Connection error: ${error}. Please check the server connection.`, 'text');
      },
    });

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
      return updated.slice(-50);
    });
  };

  // Handle voice input
  const handleVoiceInput = (transcript: string) => {
    if (!geminiService || !connected) return;
    setIsProcessing(true);
    geminiService.sendText(transcript);
  };

  // Handle text input
  const handleTextInput = (text: string) => {
    if (!geminiService || !connected) return;
    addMessage('user', text, 'text');
    setIsProcessing(true);
    geminiService.sendText(text);
  };

  // Toggle camera
  const handleCameraToggle = async () => {
    if (!cameraService) return;

    if (cameraState === 'active') {
      cameraService.stop();
      setVideoElement(null);
      setAREnabled(false);
    } else {
      await cameraService.start(preferences.preferredCamera);
      const video = cameraService.getVideoElement();
      setVideoElement(video);
      setAREnabled(true);
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

  // Handle language change
  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    if (voiceService) {
      voiceService.setLanguage(language);
    }
  };

  // Settings
  const handleSettings = () => {
    alert('Settings coming soon!');
  };

  return (
    <I18nextProvider i18n={i18n}>
      <div className="h-screen w-screen flex flex-col bg-black">
        {/* Header with Language Selector */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-700 to-orange-600">
          <Header
            connected={connected}
            connectionQuality={connectionQuality}
            onSettingsClick={handleSettings}
          />
          <LanguageSelector onLanguageChange={handleLanguageChange} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 pt-14 pb-20 overflow-hidden relative">
          {currentView === 'camera' && (
            <div className="relative h-full w-full">
              {/* Camera Preview */}
              <CameraPreview
                videoElement={videoElement}
                cameraState={cameraState}
                overlayMessage={overlayMessage}
              />

              {/* Phase 2: AR Canvas Overlay */}
              {videoElement && cameraState === 'active' && (
                <ARCanvas
                  detectedObjects={detectedObjects}
                  navigationArrows={navigationArrows}
                  config={arConfig}
                  videoElement={videoElement}
                />
              )}

              {/* Phase 2: Navigation Arrows (2D fallback) */}
              {navigationArrows.length > 0 && (
                <NavigationArrowGroup arrows={navigationArrows} />
              )}

              {/* Phase 2: Scan Line Effect */}
              <ScanLineEffect active={isProcessing && cameraState === 'active'} />

              {/* Object Detection Count */}
              {detectedObjects.length > 0 && (
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg text-white text-sm z-20">
                  {detectedObjects.length} object{detectedObjects.length !== 1 && 's'} detected
                </div>
              )}
            </div>
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
              <div className="overflow-hidden relative">
                <CameraPreview
                  videoElement={videoElement}
                  cameraState={cameraState}
                  overlayMessage={overlayMessage}
                />
                {videoElement && cameraState === 'active' && (
                  <ARCanvas
                    detectedObjects={detectedObjects}
                    navigationArrows={navigationArrows}
                    config={arConfig}
                    videoElement={videoElement}
                  />
                )}
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

        {/* Phase 2: AR Mode Indicator */}
        {arConfig.enabled && cameraState === 'active' && (
          <div className="fixed bottom-24 right-4 bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-lg text-green-400 text-xs font-bold z-20 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AR ACTIVE
          </div>
        )}
      </div>
    </I18nextProvider>
  );
}
