# Phase 2 Activation Guide

## Quick Start

Phase 2 has been fully implemented! Follow these steps to activate it:

### 1. Activate Phase 2 Code

Replace the current page with the Phase 2 version:

```bash
cd /Users/krishnaniharsunkara/Desktop/Vision/reality-lens

# Backup Phase 1
mv app/page.tsx app/page-phase1-backup.tsx

# Activate Phase 2
mv app/page-phase2.tsx app/page.tsx
```

### 2. Verify Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install --legacy-peer-deps
```

### 3. Start the Application

```bash
# Terminal 1: Backend server
cd server
npm run dev

# Terminal 2: Frontend (in a new terminal)
cd /Users/krishnaniharsunkara/Desktop/Vision/reality-lens
npm run dev
```

### 4. Open in Browser

Visit [http://localhost:3000](http://localhost:3000)

For camera/microphone access, use HTTPS via ngrok:
```bash
ngrok http 3000
```

---

## What's New in Phase 2

### Visual Features
- **AR Overlays**: Three.js canvas with object detection bounding boxes
- **Navigation Arrows**: Animated arrows pointing to destinations
- **Visual Effects**: Ripple, scan line, and glow animations
- **Language Selector**: Top-right globe icon to switch languages

### Functional Features
- **Object Detection**: Parses Gemini responses for detected objects
- **Multi-Language Support**: English, Hindi, Spanish (full translations)
- **Performance Monitoring**: Auto-adjusts quality based on FPS
- **AR State Management**: useAR hook for AR functionality

---

## Testing Phase 2

### 1. Object Detection
1. Enable camera (tap camera button)
2. Point at objects
3. Say or type: "What do you see?"
4. Observe detection count in top-left corner

**Note**: Bounding boxes will appear once Gemini returns structured detection data.

### 2. Language Switching
1. Click globe icon (top-right)
2. Select Hindi (हिन्दी) or Spanish (Español)
3. Observe UI language change
4. All controls and messages update to selected language

### 3. Visual Effects
- **Scan Line**: Animates during processing
- **AR Badge**: Shows "AR ACTIVE" when camera is on
- **Smooth Animations**: All transitions are fluid

### 4. Performance
- Open browser console
- Watch for FPS metrics
- System auto-adjusts quality if FPS drops below 20

---

## Reverting to Phase 1

If you need to go back:

```bash
# Restore Phase 1
mv app/page.tsx app/page-phase2.tsx
mv app/page-phase1-backup.tsx app/page.tsx
```

---

## Troubleshooting

### AR canvas doesn't show
- Verify camera is enabled
- Check browser console for WebGL errors
- Try different performance mode in code

### Language selector not visible
- Clear browser cache
- Check if Header component renders properly
- Verify i18next is loaded (check console)

### Performance issues
Lower the performance mode in [app/page.tsx](app/page.tsx):
```typescript
const {
  ...
} = useAR({
  performanceMode: 'low', // Change from 'medium' to 'low'
});
```

---

## Next Steps

### To Enable Full AR Functionality

Update Gemini system prompt (in backend) to return structured JSON:

```typescript
// In server/src/gemini-live-service.ts
const systemPrompt = `
You are Reality Lens AI with augmented reality capabilities.

When detecting objects, respond with JSON:
{
  "message": "I can see three gates ahead",
  "objects": [
    {
      "type": "gate",
      "label": "Gate 23",
      "bounds": { "x": 0.4, "y": 0.3, "width": 0.2, "height": 0.15 },
      "confidence": 0.95
    }
  ]
}

When giving directions:
{
  "message": "Walk straight for 50 meters",
  "navigation": {
    "steps": [
      { "action": "straight", "distance": 50, "description": "Continue forward" }
    ],
    "destination": "Gate 23"
  }
}
`;
```

Then AR overlays will automatically render based on Gemini's responses!

---

## Files Modified

Phase 2 adds these new files:
- `components/ar/*` - AR components
- `components/effects/*` - Visual effects
- `components/i18n/*` - Language selector
- `lib/ar-service.ts` - AR utilities
- `lib/object-detection.ts` - Detection parsing
- `lib/i18n.ts` - i18next config
- `hooks/useAR.ts` - AR hook
- `locales/**/*` - Translation files
- `app/page-phase2.tsx` - Enhanced main page

---

## Documentation

- [Phase 2 Specification](../phase2-xr-overlays-spec.md)
- [Implementation Summary](../phase2-implementation-summary.md)
- [Phase 1 Foundation](../phase1-foundation-spec.md)

---

**Status**: ✅ Phase 2 Ready for Testing
**Date**: October 16, 2025
