import WebSocket, { WebSocketServer } from 'ws';
import { GeminiLiveService } from './gemini-live-service.js';
import type {
  ClientMessage,
  ServerMessage,
  ConnectionState,
  GeminiLiveConfig,
} from './types.js';

/**
 * WebSocket server for handling client connections
 * Manages video/audio streaming between browser and Gemini Live API
 */
export class RealityLensWebSocketServer {
  private wss: WebSocketServer;
  private connections = new Map<string, ConnectionState>();
  private config: GeminiLiveConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(server: any, config: GeminiLiveConfig) {
    this.config = config;
    this.wss = new WebSocketServer({ server });

    console.log('[WS Server] WebSocket server initialized');

    this.setupConnectionHandler();

    // Cleanup stale connections every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000);
  }

  /**
   * Setup WebSocket connection handler
   */
  private setupConnectionHandler(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const connectionId = this.generateConnectionId();
      console.log(`[WS Server] New client connected: ${connectionId}`);

      // Create connection state
      const state: ConnectionState = {
        id: connectionId,
        clientWs: ws as any,
        geminiWs: null,
        isActive: true,
        lastActivity: Date.now(),
        frameCount: 0,
      };

      this.connections.set(connectionId, state);

      // Initialize Gemini Live connection
      this.initializeGeminiConnection(connectionId, state);

      // Handle client messages
      ws.on('message', (data: Buffer) => {
        this.handleClientMessage(connectionId, data);
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`[WS Server] Client disconnected: ${connectionId}`);
        this.cleanupConnection(connectionId);
      });

      // Handle errors
      ws.on('error', (error: Error) => {
        console.error(`[WS Server] WebSocket error for ${connectionId}:`, error);
        this.cleanupConnection(connectionId);
      });

      // Send connection confirmation
      this.sendToClient(connectionId, {
        type: 'status',
        data: {
          status: 'initializing',
          timestamp: Date.now(),
        },
      });
    });
  }

  /**
   * Initialize Gemini Live connection for a client
   */
  private async initializeGeminiConnection(
    connectionId: string,
    state: ConnectionState
  ): Promise<void> {
    try {
      const geminiService = new GeminiLiveService(this.config);

      // Setup message handler
      geminiService.onMessage((message: ServerMessage) => {
        this.sendToClient(connectionId, message);
      });

      // Setup error handler
      geminiService.onError((error: Error) => {
        console.error(`[WS Server] Gemini error for ${connectionId}:`, error);
        this.sendToClient(connectionId, {
          type: 'error',
          data: {
            error: error.message,
            timestamp: Date.now(),
          },
        });
      });

      // Connect to Gemini Live
      await geminiService.connect();

      // Store reference (we'll need to access it later)
      (state as any).geminiService = geminiService;

      console.log(`[WS Server] Gemini Live connected for ${connectionId}`);
    } catch (error) {
      console.error(`[WS Server] Failed to initialize Gemini for ${connectionId}:`, error);
      this.sendToClient(connectionId, {
        type: 'error',
        data: {
          error: 'Failed to connect to Gemini Live',
          timestamp: Date.now(),
        },
      });
    }
  }

  /**
   * Handle incoming message from client
   */
  private handleClientMessage(connectionId: string, data: Buffer): void {
    const state = this.connections.get(connectionId);
    if (!state || !state.isActive) {
      return;
    }

    state.lastActivity = Date.now();

    try {
      const message: ClientMessage = JSON.parse(data.toString());
      const geminiService = (state as any).geminiService as GeminiLiveService;

      if (!geminiService) {
        console.error(`[WS Server] No Gemini service for ${connectionId}`);
        return;
      }

      switch (message.type) {
        case 'video_frame':
          if (message.data?.frame) {
            state.frameCount++;

            // Log every 30 frames (roughly every 30 seconds at 1 FPS)
            if (state.frameCount % 30 === 0) {
              console.log(`[WS Server] Processed ${state.frameCount} frames for ${connectionId}`);
            }

            // Remove data URL prefix if present
            const base64Frame = message.data.frame.replace(/^data:image\/\w+;base64,/, '');
            geminiService.sendVideoFrame(base64Frame);
          }
          break;

        case 'audio_chunk':
          if (message.data?.audio) {
            const base64Audio = message.data.audio.replace(/^data:audio\/\w+;base64,/, '');
            geminiService.sendAudioChunk(base64Audio);
          }
          break;

        case 'text':
          // For text messages, we can send as a special frame with text overlay
          console.log(`[WS Server] Text message from ${connectionId}:`, message.data?.text);
          break;

        case 'end':
          console.log(`[WS Server] Client ${connectionId} ending session`);
          this.cleanupConnection(connectionId);
          break;

        default:
          console.warn(`[WS Server] Unknown message type from ${connectionId}:`, message.type);
      }
    } catch (error) {
      console.error(`[WS Server] Error handling message from ${connectionId}:`, error);
    }
  }

  /**
   * Send message to client
   */
  private sendToClient(connectionId: string, message: ServerMessage): void {
    const state = this.connections.get(connectionId);
    if (!state || !state.clientWs) {
      return;
    }

    try {
      const payload = JSON.stringify(message);
      if (state.clientWs.readyState === WebSocket.OPEN) {
        state.clientWs.send(payload);
      }
    } catch (error) {
      console.error(`[WS Server] Error sending to client ${connectionId}:`, error);
    }
  }

  /**
   * Cleanup connection
   */
  private cleanupConnection(connectionId: string): void {
    const state = this.connections.get(connectionId);
    if (!state) {
      return;
    }

    console.log(`[WS Server] Cleaning up connection ${connectionId}`);

    // Close Gemini connection
    const geminiService = (state as any).geminiService as GeminiLiveService;
    if (geminiService) {
      geminiService.disconnect();
    }

    // Close client connection
    if (state.clientWs && state.clientWs.readyState === WebSocket.OPEN) {
      state.clientWs.close();
    }

    state.isActive = false;
    this.connections.delete(connectionId);
  }

  /**
   * Cleanup stale connections (inactive for > 5 minutes)
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [connectionId, state] of this.connections.entries()) {
      if (now - state.lastActivity > staleThreshold) {
        console.log(`[WS Server] Cleaning up stale connection ${connectionId}`);
        this.cleanupConnection(connectionId);
      }
    }
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get active connections count
   */
  getActiveConnectionsCount(): number {
    return Array.from(this.connections.values()).filter((s) => s.isActive).length;
  }

  /**
   * Shutdown server
   */
  shutdown(): void {
    console.log('[WS Server] Shutting down...');

    // Cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Cleanup all connections
    for (const connectionId of this.connections.keys()) {
      this.cleanupConnection(connectionId);
    }

    // Close WebSocket server
    this.wss.close();
  }
}
