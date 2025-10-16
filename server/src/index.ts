import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { RealityLensWebSocketServer } from './websocket-server.js';
import type { GeminiLiveConfig } from './types.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Validate required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is required in .env file');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: wsServer.getActiveConnectionsCount(),
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Reality Lens Server',
    version: '0.1.0',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    websocketEndpoint: '/ws',
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
const geminiConfig: GeminiLiveConfig = {
  apiKey: process.env.GEMINI_API_KEY!,
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000', 10),
};

const wsServer = new RealityLensWebSocketServer(server, geminiConfig);

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('🚀 Reality Lens Server Started');
  console.log('================================');
  console.log(`📡 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🤖 Gemini Model: ${geminiConfig.model}`);
  console.log(`🌡️  Temperature: ${geminiConfig.temperature}`);
  console.log('================================');
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  /health       - Health check`);
  console.log(`  GET  /api/info     - API information`);
  console.log(`  WS   /             - WebSocket connection`);
  console.log('');
  console.log('Ready to accept connections! ✅');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  wsServer.shutdown();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  wsServer.shutdown();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
