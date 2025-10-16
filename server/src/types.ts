// Server-side types for Reality Lens

export interface GeminiLiveConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ClientMessage {
  type: 'setup' | 'video_frame' | 'audio_chunk' | 'text' | 'end';
  data?: {
    frame?: string; // base64 encoded image
    audio?: string; // base64 encoded audio
    text?: string;
    timestamp?: number;
  };
}

export interface ServerMessage {
  type: 'connected' | 'response' | 'error' | 'status';
  data?: {
    text?: string;
    audio?: string; // base64 encoded audio from Gemini
    error?: string;
    status?: string;
    timestamp?: number;
  };
}

export interface GeminiLiveMessage {
  setup?: {
    model: string;
    generation_config?: {
      temperature?: number;
      max_output_tokens?: number;
      response_modalities?: string[];
    };
    system_instruction?: {
      parts: Array<{ text: string }>;
    };
  };
  realtimeInput?: {
    mediaChunks?: Array<{
      data: string; // base64
      mimeType: string;
    }>;
  };
  toolResponse?: unknown;
}

export interface GeminiLiveResponse {
  serverContent?: {
    modelTurn?: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    turnComplete?: boolean;
  };
  toolCall?: unknown;
  setupComplete?: boolean;
}

export interface ConnectionState {
  id: string;
  clientWs: WebSocket | null;
  geminiWs: WebSocket | null;
  isActive: boolean;
  lastActivity: number;
  frameCount: number;
}

export interface WebSocket {
  send(data: string | Buffer): void;
  close(): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
  readyState: number;
}
