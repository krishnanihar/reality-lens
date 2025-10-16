import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiConfig, GeminiMessage, GeminiResponse } from '@/types';
import { getBackoffDelay } from './utils';

type MessageCallback = (response: GeminiResponse) => void;
type ErrorCallback = (error: Error) => void;
type ConnectionCallback = (connected: boolean) => void;

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chat: any;
  private config: GeminiConfig;
  private messageQueue: GeminiMessage[] = [];
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private onMessageCallback?: MessageCallback;
  private onErrorCallback?: ErrorCallback;
  private onConnectionCallback?: ConnectionCallback;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.initializeModel();
  }

  private initializeModel() {
    try {
      this.model = this.genAI.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens || 1000,
        },
      });

      this.chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: this.config.systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I am ready to assist as Air India\'s Reality Lens AI assistant.' }],
          },
        ],
      });

      this.isConnected = true;
      this.retryCount = 0;
      this.startHeartbeat();
      this.notifyConnection(true);
      this.processMessageQueue();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  /**
   * Send a text message to Gemini
   */
  async sendText(text: string): Promise<void> {
    const message: GeminiMessage = {
      type: 'text',
      content: text,
      timestamp: Date.now(),
    };

    if (!this.isConnected) {
      this.messageQueue.push(message);
      this.attemptReconnect();
      return;
    }

    try {
      const result = await this.chat.sendMessage(text);
      const response = await result.response;
      const responseText = response.text();

      this.notifyMessage({
        text: responseText,
      });
    } catch (error) {
      this.handleError(error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Send an image to Gemini
   */
  async sendImage(imageBase64: string, prompt?: string): Promise<void> {
    const message: GeminiMessage = {
      type: 'image',
      content: imageBase64,
      timestamp: Date.now(),
      metadata: { prompt },
    };

    if (!this.isConnected) {
      this.messageQueue.push(message);
      this.attemptReconnect();
      return;
    }

    try {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      };

      const result = await this.chat.sendMessage([
        prompt || 'What do you see in this image?',
        imagePart,
      ]);

      const response = await result.response;
      const responseText = response.text();

      this.notifyMessage({
        text: responseText,
      });
    } catch (error) {
      this.handleError(error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Send combined text and image
   */
  async sendMultimodal(text: string, imageBase64?: string): Promise<void> {
    if (!imageBase64) {
      return this.sendText(text);
    }

    const message: GeminiMessage = {
      type: 'image',
      content: imageBase64,
      timestamp: Date.now(),
      metadata: { prompt: text },
    };

    if (!this.isConnected) {
      this.messageQueue.push(message);
      this.attemptReconnect();
      return;
    }

    try {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      };

      const result = await this.chat.sendMessage([text, imagePart]);
      const response = await result.response;
      const responseText = response.text();

      this.notifyMessage({
        text: responseText,
      });
    } catch (error) {
      this.handleError(error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Process queued messages
   */
  private async processMessageQueue(): Promise<void> {
    if (!this.isConnected || this.messageQueue.length === 0) {
      return;
    }

    const message = this.messageQueue.shift();
    if (!message) return;

    try {
      if (message.type === 'text') {
        await this.sendText(message.content);
      } else if (message.type === 'image') {
        await this.sendImage(
          message.content,
          message.metadata?.prompt as string
        );
      }

      // Process next message after a short delay
      if (this.messageQueue.length > 0) {
        setTimeout(() => this.processMessageQueue(), 500);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Attempt to reconnect after connection failure
   */
  private async attemptReconnect(): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      this.notifyError(new Error('Maximum retry attempts reached'));
      return;
    }

    const delay = getBackoffDelay(this.retryCount);
    this.retryCount++;

    setTimeout(() => {
      this.initializeModel();
    }, delay);
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send a lightweight ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.messageQueue.length === 0) {
        // Connection is alive, no need to ping with Gemini API
        // Just verify the model is still accessible
        if (!this.model || !this.chat) {
          this.isConnected = false;
          this.notifyConnection(false);
          this.attemptReconnect();
        }
      }
    }, 30000);
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: unknown): void {
    this.isConnected = false;
    this.notifyConnection(false);

    const err = error instanceof Error ? error : new Error('Connection failed');
    this.notifyError(err);

    if (this.retryCount < this.maxRetries) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle general errors
   */
  private handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    this.notifyError(err);
  }

  /**
   * Notify message callback
   */
  private notifyMessage(response: GeminiResponse): void {
    if (this.onMessageCallback) {
      this.onMessageCallback(response);
    }
  }

  /**
   * Notify error callback
   */
  private notifyError(error: Error): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  /**
   * Notify connection callback
   */
  private notifyConnection(connected: boolean): void {
    if (this.onConnectionCallback) {
      this.onConnectionCallback(connected);
    }
  }

  /**
   * Set callback handlers
   */
  onMessage(callback: MessageCallback): void {
    this.onMessageCallback = callback;
  }

  onError(callback: ErrorCallback): void {
    this.onErrorCallback = callback;
  }

  onConnection(callback: ConnectionCallback): void {
    this.onConnectionCallback = callback;
  }

  /**
   * Check if connected
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get queued message count
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isConnected = false;
    this.chat = null;
    this.model = null;
    this.messageQueue = [];
    this.notifyConnection(false);
  }
}
