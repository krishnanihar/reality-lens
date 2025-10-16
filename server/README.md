# Reality Lens Server

Backend server for Reality Lens that provides WebSocket proxy to Gemini Live API for real-time multimodal AI interaction.

## Architecture

```
Browser (Frontend)  ↔  WebSocket  ↔  Node.js Server  ↔  WebSocket  ↔  Gemini Live API
                                         (Proxy)
```

The server acts as a proxy between the browser and Gemini Live API to:
- Manage WebSocket connections to Gemini Live
- Handle real-time video frame streaming
- Process bidirectional audio streaming
- Maintain connection state and error handling
- Provide reconnection logic with exponential backoff

## Features

- ✅ WebSocket server for client connections
- ✅ Gemini Live API integration
- ✅ Real-time video frame streaming (1 FPS from camera)
- ✅ Audio streaming support (bidirectional)
- ✅ Automatic reconnection with exponential backoff
- ✅ Connection state management
- ✅ Stale connection cleanup
- ✅ CORS support for frontend
- ✅ Health check endpoint
- ✅ Graceful shutdown

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Create `.env` file (or copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required: Gemini API Key
GEMINI_API_KEY=your_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Gemini Live API Configuration
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=1000
```

### 3. Run the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Endpoints

### HTTP Endpoints

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "uptime": 123.45,
  "connections": 2
}
```

#### `GET /api/info`
API information

**Response:**
```json
{
  "name": "Reality Lens Server",
  "version": "0.1.0",
  "geminiModel": "gemini-2.0-flash-exp",
  "websocketEndpoint": "/ws"
}
```

### WebSocket Connection

Connect to `ws://localhost:3001` (or your configured URL).

#### Client → Server Messages

**Video Frame:**
```json
{
  "type": "video_frame",
  "data": {
    "frame": "data:image/jpeg;base64,...",
    "timestamp": 1234567890
  }
}
```

**Audio Chunk:**
```json
{
  "type": "audio_chunk",
  "data": {
    "audio": "data:audio/pcm;base64,...",
    "timestamp": 1234567890
  }
}
```

**Text Message:**
```json
{
  "type": "text",
  "data": {
    "text": "What do you see?",
    "timestamp": 1234567890
  }
}
```

**End Session:**
```json
{
  "type": "end"
}
```

#### Server → Client Messages

**Connected:**
```json
{
  "type": "connected",
  "data": {
    "status": "ready",
    "timestamp": 1234567890
  }
}
```

**Response:**
```json
{
  "type": "response",
  "data": {
    "text": "I can see a red car...",
    "audio": "base64_encoded_audio...",
    "timestamp": 1234567890
  }
}
```

**Error:**
```json
{
  "type": "error",
  "data": {
    "error": "Connection failed",
    "timestamp": 1234567890
  }
}
```

**Status:**
```json
{
  "type": "status",
  "data": {
    "status": "initializing",
    "timestamp": 1234567890
  }
}
```

## Project Structure

```
server/
├── src/
│   ├── index.ts                  # Main server entry point
│   ├── types.ts                  # TypeScript type definitions
│   ├── gemini-live-service.ts    # Gemini Live API integration
│   └── websocket-server.ts       # WebSocket server for clients
├── dist/                         # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env                          # Environment variables (create this)
├── .env.example                  # Environment template
└── README.md
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Logging

The server provides detailed logging:

```
[WS Server] New client connected: conn_1234567890_abc123
[Gemini Live] Connecting to WebSocket...
[Gemini Live] WebSocket connected ✅
[Gemini Live] Setup complete ✅
[WS Server] Processed 30 frames for conn_1234567890_abc123
[Gemini Live] Received text: I can see a red car...
```

### Connection Lifecycle

1. Client connects to WebSocket server
2. Server creates Gemini Live connection
3. Server sends setup message to Gemini Live
4. Gemini Live confirms setup complete
5. Client starts streaming video frames (1 FPS)
6. User sends text/voice prompts
7. Gemini Live responds with text/audio
8. Server forwards responses to client

### Error Handling

- **Connection errors**: Automatic reconnection with exponential backoff (max 3 attempts)
- **Stale connections**: Cleanup after 5 minutes of inactivity
- **Gemini API errors**: Forwarded to client with detailed error messages
- **Graceful shutdown**: SIGTERM/SIGINT handlers cleanup all connections

## Troubleshooting

### Server won't start

- Check `.env` file exists and has valid `GEMINI_API_KEY`
- Ensure port 3001 is not already in use
- Check Node.js version (requires Node 18+)

### WebSocket connection fails

- Verify server is running (`npm run dev`)
- Check CORS configuration in `.env` (FRONTEND_URL)
- Ensure frontend is connecting to correct URL

### Gemini Live API errors

- Verify API key is valid and has Gemini Live access
- Check model name in `.env` (must be Live-compatible model)
- Review server logs for detailed error messages

### Performance issues

- Monitor frame rate (logged every 30 frames)
- Check network latency to Gemini API
- Review connection cleanup logs

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
GEMINI_API_KEY=your_production_key
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
GEMINI_MODEL=gemini-2.0-flash-exp
```

### Deployment Options

**Option 1: Same server as frontend**
- Build both frontend and backend
- Run backend on port 3001
- Configure reverse proxy (nginx) to route WebSocket connections

**Option 2: Separate backend server**
- Deploy backend to separate server
- Update frontend `NEXT_PUBLIC_WS_SERVER_URL` to backend URL
- Ensure WebSocket port is open and accessible

**Option 3: Cloud platforms**
- **Heroku**: Use `npm start` as Procfile command
- **Railway**: Auto-detects Node.js, configure environment variables
- **Render**: Set build command to `npm run build`, start command to `npm start`
- **AWS/GCP/Azure**: Deploy as containerized app or serverless function

### Health Monitoring

Use `/health` endpoint for health checks:

```bash
curl http://localhost:3001/health
```

## Security Considerations

- ✅ API key stored in environment variables (not committed to git)
- ✅ CORS enabled for specific frontend origin only
- ✅ Connection limits and cleanup to prevent abuse
- ⚠️ Add rate limiting for production
- ⚠️ Add authentication for client connections
- ⚠️ Add request size limits
- ⚠️ Add SSL/TLS termination

## License

Part of Reality Lens project.
