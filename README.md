# Reality Lens - Phase 2: Gemini Live + XR Overlays

Air India's Reality Lens AI assistant with real-time camera streaming, live AI vision, and augmented reality overlays powered by Gemini Live API.

## 🎯 What's New in Phase 2

- **Gemini Live API**: Real-time bidirectional streaming with continuous video processing
- **WebSocket Architecture**: Browser → Backend Server → Gemini Live API
- **Continuous Vision**: AI sees what you see in real-time (not just on-demand snapshots)
- **Backend Server**: Node.js/Express server for API proxy and connection management
- **Live Responses**: Near-instant AI responses as you move and interact with environment
- **Audio Streaming**: Bidirectional audio support (future: Gemini's voice responses)

## 🚀 Features

- **Real-time Camera Streaming**: Continuous 1 FPS video streaming to AI
- **Voice Input/Output**: Natural voice conversations with AI using Web Speech APIs
- **Gemini Live Integration**: True multimodal AI with live vision capabilities
- **Progressive Web App**: Installable on mobile devices with offline support
- **Responsive UI**: Air India branded interface with real-time status indicators
- **WebSocket Communication**: Low-latency bidirectional streaming

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **Icons**: lucide-react
- **Communication**: WebSocket (native)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express
- **WebSocket**: ws library
- **AI**: Google Gemini Live API (gemini-2.0-flash-exp)
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- HTTPS for camera/microphone access (use ngrok or deploy to production)

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd reality-lens

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

**Frontend** - Create `.env.local` in root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# WebSocket server URL (backend)
NEXT_PUBLIC_WS_SERVER_URL=ws://localhost:3001
```

**Backend** - Create `.env` in server directory:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
# Required: Gemini API Key
GEMINI_API_KEY=your_actual_api_key_here

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

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note**: Camera and microphone require HTTPS. For local development with HTTPS:

```bash
# Using ngrok
ngrok http 3000
```

### 4. Build for Production

```bash
npm run build
npm start
```

## Usage

### Camera Mode
1. Click the camera button to activate camera
2. Point camera at any object or text
3. Use voice or keyboard to ask questions about what you see
4. AI will respond with voice and text

### Voice Mode
1. Click the microphone button to start listening
2. Speak your question or command
3. AI will respond with voice and text

### Text Mode
1. Click the keyboard button
2. Type your message
3. AI will respond based on current context

## Browser Support

- Chrome 89+
- Safari 15+
- Edge 89+
- Firefox 88+

Required features:
- WebSocket
- getUserMedia (camera access)
- Web Speech API (voice)
- Service Workers (PWA)

## Project Structure

```
reality-lens/
├── app/
│   ├── page.tsx          # Main application
│   ├── layout.tsx        # Root layout with metadata
│   └── globals.css       # Global styles
├── components/
│   ├── Header.tsx        # Top navigation bar
│   ├── ControlsBar.tsx   # Bottom control buttons
│   ├── CameraPreview.tsx # Camera feed display
│   ├── MessageDisplay.tsx # Chat messages
│   └── TextInput.tsx     # Text input component
├── lib/
│   ├── gemini-service.ts # Gemini AI integration
│   ├── camera-service.ts # Camera capture logic
│   ├── voice-service.ts  # Voice input/output
│   └── utils.ts          # Utility functions
├── types/
│   └── index.ts          # TypeScript types
├── hooks/
│   └── usePreferences.ts # User preferences hook
└── public/
    └── manifest.json     # PWA manifest
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variable `NEXT_PUBLIC_GEMINI_API_KEY`
4. Deploy

### Other Platforms

Ensure your platform supports:
- Node.js 18+
- Environment variables
- HTTPS (required for camera/microphone)

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS
- Check browser permissions
- Try different camera (front/back)

### Voice Not Working
- Check microphone permissions
- Ensure browser supports Web Speech API
- Try speaking louder or closer to microphone

### Gemini Not Responding
- Verify API key is correct
- Check network connection
- Look for errors in browser console

## Success Criteria (Phase 1)

- ✅ Gemini Live WebSocket connection
- ✅ Camera feed streaming at 1 FPS
- ✅ Voice input and output
- ✅ Response display in UI
- ✅ PWA installation
- ✅ Error handling
- ✅ Vercel deployment ready

## Demo Scenario

**The Magic Moment**: Point camera at a menu, ask "What's vegetarian here?", and hear Gemini explain the vegetarian options while seeing the response overlaid on screen.

## Next Steps (Phase 2)

- Three.js for AR overlays
- Real-time object highlighting
- Navigation arrows
- Visual effects and animations
- Multi-language support

## License

Copyright © 2024 Air India. All rights reserved.
