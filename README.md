# Reality Lens - Phase 1: Foundation

Air India's Reality Lens AI assistant with real-time camera and voice interaction powered by Gemini Live.

## Features

- **Real-time Camera Streaming**: Captures and processes camera feed at 1 FPS
- **Voice Input/Output**: Natural voice conversations with AI using Web Speech APIs
- **Gemini Live Integration**: Multimodal AI responses combining vision and voice
- **Progressive Web App**: Installable on mobile devices with offline support
- **Responsive UI**: Air India branded interface with real-time status indicators

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.0 Flash Exp
- **PWA**: next-pwa
- **Icons**: lucide-react

## Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- HTTPS for camera/microphone access (use ngrok or deploy to Vercel)

## Getting Started

### 1. Clone and Install

```bash
cd reality-lens
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Gemini API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
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
