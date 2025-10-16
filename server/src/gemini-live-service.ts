import WebSocket from 'ws';
import type {
  GeminiLiveConfig,
  GeminiLiveMessage,
  GeminiLiveResponse,
  ServerMessage,
} from './types.js';

/**
 * Service for managing Gemini Live API WebSocket connections
 * Handles bidirectional streaming of video, audio, and text
 */
export class GeminiLiveService {
  private config: GeminiLiveConfig;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000; // Start with 1 second
  private messageQueue: GeminiLiveMessage[] = [];
  private onMessageCallback?: (message: ServerMessage) => void;
  private onErrorCallback?: (error: Error) => void;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  /**
   * Initialize connection to Gemini Live API
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;

        console.log('[Gemini Live] Connecting to WebSocket...');
        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          console.log('[Gemini Live] WebSocket connected ✅');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send setup message
          this.sendSetup();

          // Process queued messages
          this.processQueue();

          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleGeminiMessage(data);
        });

        this.ws.on('error', (error: Error) => {
          console.error('[Gemini Live] WebSocket error:', error);
          if (this.onErrorCallback) {
            this.onErrorCallback(error);
          }
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('[Gemini Live] WebSocket closed');
          this.isConnected = false;
          this.attemptReconnect();
        });
      } catch (error) {
        console.error('[Gemini Live] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Send setup configuration to Gemini Live
   */
  private sendSetup(): void {
    const setupMessage: GeminiLiveMessage = {
      setup: {
        model: this.config.model,
        generation_config: {
          temperature: this.config.temperature,
          max_output_tokens: this.config.maxTokens,
          response_modalities: ['TEXT', 'AUDIO'],
        },
        system_instruction: {
          parts: [
            {
              text: `You are Reality Lens AI, an intelligent assistant for Air India passengers.
You help travelers navigate airports, understand menus, read signs, and provide real-time assistance.
You receive live video feed and can see what the user sees through their camera.
Respond naturally and helpfully. Keep responses concise and actionable.
When you see text in the camera feed, read it out loud clearly.
When asked about menu items, identify vegetarian/non-vegetarian options.
When asked for directions, provide clear step-by-step guidance.
Be friendly, professional, and helpful.`,
            },
          ],
        },
      },
    };

    this.sendMessage(setupMessage);
  }

  /**
   * Send video frame to Gemini Live
   */
  sendVideoFrame(base64Frame: string): void {
    const message: GeminiLiveMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            data: base64Frame,
            mimeType: 'image/jpeg',
          },
        ],
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send audio chunk to Gemini Live
   */
  sendAudioChunk(base64Audio: string): void {
    const message: GeminiLiveMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            data: base64Audio,
            mimeType: 'audio/pcm',
          },
        ],
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send message to Gemini Live WebSocket
   */
  private sendMessage(message: GeminiLiveMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[Gemini Live] Connection not ready, queuing message');
      this.messageQueue.push(message);
      return;
    }

    try {
      const payload = JSON.stringify(message);
      this.ws.send(payload);
      console.log('[Gemini Live] Message sent:', message.setup ? 'SETUP' : 'DATA');
    } catch (error) {
      console.error('[Gemini Live] Error sending message:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages
   */
  private processQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  /**
   * Handle incoming message from Gemini Live
   */
  private handleGeminiMessage(data: WebSocket.Data): void {
    try {
      const message: GeminiLiveResponse = JSON.parse(data.toString());

      // Handle setup complete
      if (message.setupComplete) {
        console.log('[Gemini Live] Setup complete ✅');
        if (this.onMessageCallback) {
          this.onMessageCallback({
            type: 'connected',
            data: {
              status: 'ready',
              timestamp: Date.now(),
            },
          });
        }
        return;
      }

      // Handle server content (responses)
      if (message.serverContent?.modelTurn) {
        const parts = message.serverContent.modelTurn.parts;

        for (const part of parts) {
          // Text response
          if (part.text) {
            console.log('[Gemini Live] Received text:', part.text.substring(0, 100));
            if (this.onMessageCallback) {
              this.onMessageCallback({
                type: 'response',
                data: {
                  text: part.text,
                  timestamp: Date.now(),
                },
              });
            }
          }

          // Audio response
          if (part.inlineData?.mimeType.startsWith('audio/')) {
            console.log('[Gemini Live] Received audio');
            if (this.onMessageCallback) {
              this.onMessageCallback({
                type: 'response',
                data: {
                  audio: part.inlineData.data,
                  timestamp: Date.now(),
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Gemini Live] Error parsing message:', error);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Gemini Live] Max reconnection attempts reached');
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('Max reconnection attempts reached'));
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[Gemini Live] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[Gemini Live] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Register callback for incoming messages
   */
  onMessage(callback: (message: ServerMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Disconnect from Gemini Live
   */
  disconnect(): void {
    if (this.ws) {
      console.log('[Gemini Live] Disconnecting...');
      this.isConnected = false;
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}
