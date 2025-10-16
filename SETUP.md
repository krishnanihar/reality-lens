# Reality Lens - Quick Setup Guide

## 🚀 Get Started in 3 Steps

### Step 1: Configure Your API Key

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Get your API key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

### Step 2: Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

⚠️ **Important**: Camera and microphone require HTTPS. For local testing with real devices, use ngrok:

```bash
ngrok http 3000
```

Then access the HTTPS URL provided by ngrok.

### Step 3: Test the App

1. **Grant Permissions**: Allow camera and microphone access when prompted
2. **Activate Camera**: Click the camera button (center button at bottom)
3. **Start Voice**: Click the microphone button to start listening
4. **Ask a Question**: Point the camera at something and ask "What do you see?"
5. **Listen to Response**: Gemini will respond with both voice and text

## 🎯 Testing the Demo Scenario

**The Magic Moment**:

1. Open a menu (or any text document) in front of your camera
2. Click the microphone button
3. Ask: "What's vegetarian here?" or "What do you see?"
4. Listen as Gemini reads back what it sees
5. See the response overlaid on the camera view

## 🔧 Troubleshooting

### Camera not working?
- Make sure you're using HTTPS (ngrok for local testing)
- Check browser permissions in settings
- Try clicking "Allow" again if denied

### Voice not working?
- Check microphone permissions
- Ensure you're using a supported browser (Chrome/Safari/Edge)
- Speak clearly and wait for the red pulsing indicator

### Gemini not responding?
- Verify your API key is correct in `.env.local`
- Check browser console for errors
- Ensure you have internet connection

## 📱 Installing as PWA

### On Mobile:
1. Open the app in Safari (iOS) or Chrome (Android)
2. Look for "Add to Home Screen" option
3. The app will install like a native app

### On Desktop:
1. Look for the install icon in the address bar
2. Click "Install" when prompted

## 🎨 Features to Try

- **Camera Mode**: Visual AI recognition
- **Voice Mode**: Hands-free interaction
- **Text Mode**: Type your questions (keyboard button)
- **Multimodal**: Combine camera + voice for best results

## 📊 Build for Production

```bash
npm run build
npm start
```

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add your API key in Vercel dashboard
# Settings -> Environment Variables -> Add
# NEXT_PUBLIC_GEMINI_API_KEY=your_key
```

## 🎉 Success Criteria Checklist

- ✅ Camera activates and shows live preview
- ✅ Voice input captures speech
- ✅ Gemini responds to questions
- ✅ Voice output speaks responses
- ✅ Works on mobile devices
- ✅ Installable as PWA
- ✅ Handles errors gracefully

## 💡 Tips

1. **Best lighting**: Ensure good lighting for camera
2. **Clear speech**: Speak clearly for voice recognition
3. **Internet**: Requires stable internet connection
4. **Browser**: Use latest Chrome, Safari, or Edge
5. **HTTPS**: Always use HTTPS for camera/mic access

## 📚 Next Steps

Once Phase 1 is working:
- Phase 2 will add AR overlays
- Real-time object highlighting
- Navigation arrows
- Multi-language support

---

Need help? Check the main README.md for detailed documentation.
