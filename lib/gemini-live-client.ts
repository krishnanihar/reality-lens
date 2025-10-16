/**
 * Gemini Live Client - WebSocket-based client for real-time AI interaction
 * Connects to Reality Lens backend server which proxies to Gemini Live API
 */

export interface GeminiLiveConfig {
  serverUrl: string;
  onConnection?: (isConnected: boolean) => void;
  onResponse?: (text: string, audio?: string, rawResponse?: any) => void;
  onError?: (error: string) => void;
}

interface ServerMessage {
  type: 'connected' | 'response' | 'error' | 'status';
  data?: {
    text?: string;
    audio?: string;
    error?: string;
    status?: string;
    timestamp?: number;
  };
}

interface ClientMessage {
  type: 'setup' | 'video_frame' | 'audio_chunk' | 'text' | 'end';
  data?: {
    frame?: string;
    audio?: string;
    text?: string;
    timestamp?: number;
  };
}

export class GeminiLiveClient {
  private config: GeminiLiveConfig;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;
  private messageQueue: ClientMessage[] = [];
  private shouldReconnect = true;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  /**
   * Connect to backend WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[Gemini Live Client] Connecting to server:', this.config.serverUrl);
        this.ws = new WebSocket(this.config.serverUrl);

        this.ws.onopen = () => {
          console.log('[Gemini Live Client] Connected to server ✅');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Process queued messages
          this.processQueue();

          if (this.config.onConnection) {
            this.config.onConnection(true);
          }

          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          this.handleServerMessage(event.data);
        };

        this.ws.onerror = (error: Event) => {
          console.error('[Gemini Live Client] WebSocket error:', error);
          if (this.config.onError) {
            this.config.onError('WebSocket connection error');
          }
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[Gemini Live Client] Disconnected from server');
          this.isConnected = false;

          if (this.config.onConnection) {
            this.config.onConnection(false);
          }

          if (this.shouldReconnect) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[Gemini Live Client] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Send video frame to server
   */
  sendVideoFrame(base64Frame: string): void {
    const message: ClientMessage = {
      type: 'video_frame',
      data: {
        frame: base64Frame,
        timestamp: Date.now(),
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send audio chunk to server
   */
  sendAudioChunk(base64Audio: string): void {
    const message: ClientMessage = {
      type: 'audio_chunk',
      data: {
        audio: base64Audio,
        timestamp: Date.now(),
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send text message to server
   */
  sendText(text: string): void {
    const message: ClientMessage = {
      type: 'text',
      data: {
        text,
        timestamp: Date.now(),
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send message to server
   */
  private sendMessage(message: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[Gemini Live Client] Connection not ready, queuing message');
      this.messageQueue.push(message);
      return;
    }

    try {
      const payload = JSON.stringify(message);
      this.ws.send(payload);
    } catch (error) {
      console.error('[Gemini Live Client] Error sending message:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages
   */
  private processQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  /**
   * Handle incoming message from server
   */
  private handleServerMessage(data: string): void {
    try {
      const message: ServerMessage = JSON.parse(data);

      switch (message.type) {
        case 'connected':
          console.log('[Gemini Live Client] Setup complete, ready for streaming');
          break;

        case 'response':
          if (message.data?.text) {
            console.log('[Gemini Live Client] Received text response:', message.data.text.substring(0, 100));
          }
          if (message.data?.audio) {
            console.log('[Gemini Live Client] Received audio response');
          }

          if (this.config.onResponse) {
            this.config.onResponse(
              message.data?.text || '',
              message.data?.audio,
              message.data // Pass raw response for Phase 2 AR processing
            );
          }
          break;

        case 'error':
          console.error('[Gemini Live Client] Server error:', message.data?.error);
          if (this.config.onError) {
            this.config.onError(message.data?.error || 'Unknown error');
          }
          break;

        case 'status':
          console.log('[Gemini Live Client] Status:', message.data?.status);
          break;

        default:
          console.warn('[Gemini Live Client] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Gemini Live Client] Error parsing server message:', error);
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Gemini Live Client] Max reconnection attempts reached');
      if (this.config.onError) {
        this.config.onError('Max reconnection attempts reached');
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[Gemini Live Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[Gemini Live Client] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.shouldReconnect = false;

    if (this.ws) {
      console.log('[Gemini Live Client] Disconnecting...');

      // Send end message
      this.sendMessage({ type: 'end' });

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
