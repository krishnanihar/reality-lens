// Core Application State Types

export type ConnectionQuality = 'good' | 'poor' | 'offline';
export type PermissionState = 'granted' | 'denied' | 'prompt';
export type ViewMode = 'camera' | 'chat' | 'combined';

export interface AppState {
  // Connection
  geminiConnected: boolean;
  connectionQuality: ConnectionQuality;

  // Camera
  cameraActive: boolean;
  cameraPermission: PermissionState;
  currentFrame: string | null;

  // Voice
  voiceActive: boolean;
  voicePermission: PermissionState;
  isListening: boolean;
  isSpeaking: boolean;

  // UI
  currentView: ViewMode;
  messages: Message[];
  isProcessing: boolean;

  // User
  sessionId: string;
  preferences: UserPreferences;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type: 'text' | 'voice' | 'camera';
}

export interface UserPreferences {
  preferredCamera: 'front' | 'back';
  voiceEnabled: boolean;
  continuousListening: boolean;
  textSize: 'normal' | 'large';
  language: string;
}

// Camera Types
export type CameraState = 'inactive' | 'requesting' | 'active' | 'processing' | 'error';

export interface CameraConfig {
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  quality: number;
  facingMode: 'user' | 'environment';
}

// Voice Types
export type AudioState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

// Gemini WebSocket Types
export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPrompt: string;
}

export interface GeminiMessage {
  type: 'text' | 'image' | 'audio';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface GeminiResponse {
  text: string;
  functionCalls?: FunctionCall[];
  error?: string;
}

export interface FunctionCall {
  name: string;
  parameters: Record<string, unknown>;
}

// Session Management
export interface Session {
  id: string;
  startTime: number;
  lastActivity: number;
  context: SessionContext;
}

export interface SessionContext {
  mode: 'camera' | 'voice' | 'both';
  location: 'pre-flight' | 'airport' | 'in-flight' | 'arrival';
  messageCount: number;
}

// Error Types
export interface AppError {
  type: 'camera' | 'voice' | 'connection' | 'permission' | 'generic';
  message: string;
  details?: string;
  recoverable: boolean;
}
