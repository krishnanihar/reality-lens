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

// ============================================
// Phase 2: AR & Advanced Features Types
// ============================================

// AR Types
export type ARMode = '2D' | '2.5D' | '3D';
export type PerformanceMode = 'high' | 'medium' | 'low';

export interface ObjectDetection {
  id: string;
  type: ObjectCategory;
  label: string;
  bounds: BoundingBox;
  confidence: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

export enum ObjectCategory {
  TEXT = 'text',
  SIGN = 'sign',
  GATE = 'gate',
  FOOD = 'food',
  PERSON = 'person',
  EXIT = 'exit',
  AMENITY = 'amenity',
  LUGGAGE = 'luggage',
  TRANSPORT = 'transport',
}

export interface BoundingBox {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  width: number; // normalized 0-1
  height: number; // normalized 0-1
}

export interface NavigationArrow {
  id: string;
  type: 'directional' | 'path' | 'turn';
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  distance: number;
  label?: string;
  color: string;
  scale: number;
}

export interface NavigationData {
  steps: NavigationStep[];
  destination: string;
  estimatedTime: number;
  totalDistance: number;
}

export interface NavigationStep {
  action: 'straight' | 'turn_left' | 'turn_right' | 'turn_around';
  distance: number;
  description: string;
  angle?: number;
}

// Enhanced Gemini Response with AR data
export interface EnhancedGeminiResponse extends GeminiResponse {
  objects?: ObjectDetection[];
  navigation?: NavigationData;
  translation?: TranslationData;
  metadata?: Record<string, any>;
}

export interface TranslationData {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  bounds?: BoundingBox;
}

// Language Types
export enum Language {
  EN_US = 'en-US',
  EN_IN = 'en-IN',
  HI_IN = 'hi-IN',
  ES_ES = 'es-ES',
  FR_FR = 'fr-FR',
  DE_DE = 'de-DE',
  JA_JP = 'ja-JP',
  ZH_CN = 'zh-CN',
  AR_SA = 'ar-SA',
  IT_IT = 'it-IT',
}

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  voiceSupported: boolean;
  rtl: boolean;
}

// Visual Effects Types
export interface VisualEffect {
  id: string;
  type: 'ripple' | 'glow' | 'pulse' | 'scan' | 'particle';
  position: { x: number; y: number };
  duration: number;
  startTime: number;
  color?: string;
  intensity?: number;
}

// Device Orientation Types
export interface DeviceOrientation {
  alpha: number; // 0-360 degrees (compass)
  beta: number; // -180 to 180 degrees (tilt front/back)
  gamma: number; // -90 to 90 degrees (tilt left/right)
  absolute: boolean;
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  heading?: number;
  speed?: number;
}

// Extended App State for Phase 2
export interface Phase2AppState extends AppState {
  // AR System
  arEnabled: boolean;
  arMode: ARMode;
  detectedObjects: ObjectDetection[];
  navigationArrows: NavigationArrow[];

  // Language
  currentLanguage: Language;
  availableLanguages: Language[];
  translationMode: boolean;

  // Visual Effects
  activeEffects: VisualEffect[];
  performanceMode: PerformanceMode;

  // Device
  deviceOrientation?: DeviceOrientation;
  gpsLocation?: GPSCoordinates;

  // Context
  currentLocation: 'pre-flight' | 'airport' | 'in-flight' | 'arrival';
  userIntent: 'navigation' | 'information' | 'translation' | 'general';
}

// Performance Monitoring
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  detectionLatency: number;
  renderLatency: number;
}

// AR Canvas Configuration
export interface ARCanvasConfig {
  enabled: boolean;
  mode: ARMode;
  maxObjects: number;
  showDebug: boolean;
  performanceMode: PerformanceMode;
}
