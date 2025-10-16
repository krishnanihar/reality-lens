# Reality Lens Phase 2: XR Overlays & Advanced Features Specification

## Overview
Phase 2 transforms Reality Lens from a conversational AI assistant into an immersive augmented reality experience. Building on the solid Phase 1 foundation (Gemini Live + Camera + Voice), we now add visual overlays, real-time object highlighting, navigation guidance, and multi-language support.

**Goal**: Create an immersive AR experience where AI insights appear directly on the camera feed with 3D graphics, animations, and spatial awareness.

**Timeline**: Week 3-5
**Success Criteria**: Can point camera at airport signage and see animated arrows guiding you to your gate, with text translated into your preferred language.

---

## Technical Requirements

### Core Technology Stack Additions

**3D/AR Graphics**
```
reality-lens/
├── Three.js (3D engine)
├── React Three Fiber (@react-three/fiber)
├── React Three Drei (@react-three/drei) - helpers
├── GSAP (animation library)
└── Framer Motion (UI animations)
```

**New Dependencies**
- `three` - Core 3D engine
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers and abstractions
- `gsap` - Professional animation library
- `framer-motion` - React animation library
- `i18next` - Internationalization
- `react-i18next` - React bindings for i18next

**Computer Vision Enhancement**
- Leverage Gemini's vision capabilities for object detection
- Parse structured responses for object coordinates
- Real-time bounding box calculations

---

## Feature Specifications

### 1. AR Overlay System

**What It Does**
- Renders 3D graphics on top of camera feed
- Maintains proper depth and perspective
- Responds to device orientation/movement
- Handles occlusion and transparency

**Technical Architecture**
```
Camera Feed (background)
    ↓
Three.js Canvas (overlay layer)
    ↓
Gemini Vision Output → Object Detection → Coordinate Mapping
    ↓
Rendered 3D Elements (arrows, highlights, text)
```

**Implementation Details**
- Use HTML5 Canvas with Three.js WebGL renderer
- Transparent background for overlay effect
- Z-index layering: Camera (-1), Canvas (0), UI (1)
- 60 FPS rendering for smooth experience
- Adaptive quality based on device performance

**Coordinate System**
```typescript
interface ObjectPosition {
  id: string;
  type: 'text' | 'object' | 'person' | 'sign' | 'gate';
  // Screen coordinates (normalized 0-1)
  x: number; // horizontal position
  y: number; // vertical position
  width: number; // normalized width
  height: number; // normalized height
  // 3D space (estimated)
  depth?: number; // distance from camera (meters)
  confidence: number; // 0-1 detection confidence
}
```

**Rendering Modes**
1. **2D Overlay Mode**: Flat graphics on screen coordinates
2. **2.5D Mode**: Perspective-aware flat elements
3. **3D Mode**: Full 3D objects with depth (future)

---

### 2. Real-Time Object Highlighting

**What It Does**
- Detects objects in camera feed via Gemini
- Draws animated bounding boxes around them
- Shows labels with confidence scores
- Highlights relevant objects based on context

**Visual Design**

**Bounding Box Styles**
```css
/* Primary highlight (main focus) */
border: 3px solid #10B981 (green)
glow: 0 0 20px rgba(16, 185, 129, 0.6)
animation: pulse 2s infinite

/* Secondary highlight (related items) */
border: 2px solid #F59E0B (amber)
glow: 0 0 15px rgba(245, 158, 11, 0.4)

/* Info highlight (contextual) */
border: 2px solid #3B82F6 (blue)
glow: 0 0 10px rgba(59, 130, 246, 0.3)
```

**Label Design**
- Position: Above bounding box (or below if near top)
- Background: Semi-transparent dark with blur
- Text: White, bold, 14px
- Icon: Category icon (food, gate, exit, etc.)
- Confidence: Small percentage below label

**Object Categories**
```typescript
enum ObjectCategory {
  TEXT = 'text',           // Readable text
  SIGN = 'sign',           // Directional signs
  GATE = 'gate',           // Airport gates
  FOOD = 'food',           // Food items/restaurants
  PERSON = 'person',       // People (privacy-aware)
  EXIT = 'exit',           // Exit signs
  AMENITY = 'amenity',     // Restrooms, shops, etc.
  LUGGAGE = 'luggage',     // Baggage areas
  TRANSPORT = 'transport', // Buses, taxis, etc.
}
```

**Detection Flow**
1. Camera sends frame to Gemini (1 FPS)
2. Gemini analyzes and returns structured JSON:
   ```json
   {
     "objects": [
       {
         "type": "gate",
         "label": "Gate 23",
         "bounds": { "x": 0.4, "y": 0.3, "w": 0.2, "h": 0.15 },
         "confidence": 0.95,
         "metadata": { "gateNumber": "23", "status": "boarding" }
       }
     ]
   }
   ```
3. Frontend renders highlights at specified coordinates
4. Updates smoothly with animation transitions

**Performance Optimization**
- Cache detections for 2 seconds
- Only re-render when camera moves significantly
- Throttle detection requests to 0.5 FPS when static
- Skip detection when no user query active

---

### 3. Navigation Arrow System

**What It Does**
- Shows 3D arrows pointing toward destinations
- Animates smoothly as user moves/rotates device
- Adapts size based on distance
- Provides clear directional guidance

**Arrow Types**

**1. Directional Arrow (Main)**
- Large 3D arrow floating in space
- Points toward destination
- Color: Air India Red (#B91C1C)
- Animation: Gentle bobbing motion
- Size: Scales with distance (closer = smaller)

**2. Path Arrow (Trail)**
- Smaller arrows showing the path
- Fade out as user progresses
- Color: Orange (#EA580C)
- Spacing: Every 2 meters

**3. Turn Indicator**
- Curved arrow for turns
- Shows direction change ahead
- Color: Yellow (#F59E0B)
- Appears 5 meters before turn

**Arrow Rendering**
```typescript
interface NavigationArrow {
  type: 'directional' | 'path' | 'turn';
  position: Vector3; // 3D world position
  direction: Vector3; // Direction vector
  distance: number; // Distance to target (meters)
  label?: string; // "Gate 23", "Exit", etc.
  color: string;
  scale: number; // Size multiplier
}
```

**3D Arrow Model**
- Built with Three.js BufferGeometry
- Material: MeshBasicMaterial with emissive glow
- Wireframe option for performance mode
- LOD (Level of Detail) for distant arrows

**Animation Sequence**
```
1. Arrow appears (fade in 0.3s)
2. Gentle float up/down (2s loop)
3. Pulse glow every 1.5s
4. Rotate toward target smoothly
5. Scale based on distance
6. Fade out when destination reached (0.5s)
```

**Distance Calculation**
- Use device GPS + compass for outdoor
- Use visual odometry for indoor (future)
- Fallback: Relative screen positioning

---

### 4. Visual Effects System

**What It Does**
- Adds polish and feedback to interactions
- Highlights important information
- Guides user attention
- Creates immersive atmosphere

**Effect Categories**

**1. Interaction Feedback**
- Tap ripple effect at touch point
- Button press animations (scale + glow)
- Voice activation wave animation
- Processing spinner with brand colors

**2. Highlight Effects**
- Scan line effect for text detection
- Shimmer effect on interactive objects
- Glow pulse for important items
- Fade transitions between states

**3. Environmental Effects**
- Particle system for ambient atmosphere
- Light rays for emphasis
- Blur backdrop for overlays
- Gradient masks for edges

**4. Transition Effects**
- Smooth mode switching (camera ↔ chat)
- Fade in/out for overlays
- Slide animations for panels
- Morph animations for icons

**Implementation with GSAP**
```typescript
// Example: Highlight animation
gsap.to(highlightRef.current, {
  scale: 1.1,
  opacity: 1,
  duration: 0.3,
  ease: "power2.out",
  yoyo: true,
  repeat: 1
});

// Example: Arrow entrance
gsap.from(arrowRef.current.position, {
  y: -2,
  opacity: 0,
  duration: 0.8,
  ease: "back.out(1.7)"
});
```

**Framer Motion for UI**
```typescript
// Example: Panel slide-in
<motion.div
  initial={{ x: 300, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 300, opacity: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
  {content}
</motion.div>
```

---

### 5. Multi-Language Support

**What It Does**
- Supports 10+ languages for Air India's routes
- Real-time translation of UI and AI responses
- Text detection with translation overlay
- Voice input/output in selected language

**Supported Languages (Phase 2)**
```typescript
enum Language {
  EN_US = 'en-US', // English (US)
  EN_IN = 'en-IN', // English (India)
  HI_IN = 'hi-IN', // Hindi
  ES_ES = 'es-ES', // Spanish
  FR_FR = 'fr-FR', // French
  DE_DE = 'de-DE', // German
  JA_JP = 'ja-JP', // Japanese
  ZH_CN = 'zh-CN', // Chinese (Simplified)
  AR_SA = 'ar-SA', // Arabic
  IT_IT = 'it-IT', // Italian
}
```

**i18next Configuration**
```typescript
// translations/en-US.json
{
  "common": {
    "camera": "Camera",
    "microphone": "Microphone",
    "keyboard": "Keyboard",
    "settings": "Settings"
  },
  "prompts": {
    "cameraPermission": "Allow camera access to use visual features",
    "micPermission": "Allow microphone access for voice input",
    "processing": "Processing...",
    "listening": "Listening..."
  },
  "errors": {
    "cameraNotAvailable": "Camera not available",
    "connectionLost": "Connection lost. Retrying...",
    "voiceNotSupported": "Voice not supported in this browser"
  }
}
```

**Translation Flow**
1. User selects language in settings
2. UI immediately updates to selected language
3. Gemini system prompt updated with language context
4. AI responses come in selected language
5. Text detection overlays show translation
6. Voice synthesis uses language-specific voice

**Text Translation Overlay**
- Original text in bounding box (dimmed)
- Translated text above (bright)
- "Original: [text]" tooltip on tap
- Toggle to show/hide original

**Voice Language Switching**
- Speech recognition API with selected language
- Speech synthesis with language-specific voice
- Fallback to English if language unavailable
- Accent/dialect selection (future)

---

### 6. Enhanced Gemini Integration

**What It Does**
- Structured output for AR rendering
- Object detection with coordinates
- Navigation instruction parsing
- Context-aware responses

**Enhanced System Prompt**
```
You are Air India's Reality Lens AI assistant with augmented reality capabilities.

Your responses should include structured data for visual overlays:

When detecting objects, respond with JSON:
{
  "message": "I can see three gates ahead",
  "objects": [
    {
      "type": "gate",
      "label": "Gate 23",
      "bounds": { "x": 0.4, "y": 0.3, "w": 0.2, "h": 0.15 },
      "confidence": 0.95,
      "metadata": { "gateNumber": "23", "status": "boarding" }
    }
  ]
}

When giving directions, include navigation data:
{
  "message": "Walk straight for 50 meters, then turn right",
  "navigation": {
    "steps": [
      { "action": "straight", "distance": 50, "description": "Continue forward" },
      { "action": "turn_right", "angle": 90, "description": "Turn right at the sign" }
    ],
    "destination": "Gate 23",
    "estimatedTime": 180
  }
}

Current capabilities:
- Real-time object detection with bounding boxes
- 3D navigation arrows
- Text translation overlays
- Multi-language support
- User language: {{language}}
- Context: {{context}}
```

**Response Parser**
```typescript
interface GeminiResponse {
  message: string; // Natural language response
  objects?: ObjectDetection[]; // For highlighting
  navigation?: NavigationData; // For arrows
  translation?: TranslationData; // For text overlay
  metadata?: Record<string, any>; // Additional context
}
```

---

## Data Flow Architecture

### Enhanced AR Pipeline
```
1. Camera Frame Capture (1 FPS)
   ↓
2. Send to Gemini via WebSocket
   ↓
3. Gemini Response (JSON + text)
   ↓
4. Parse Response
   ├─→ Natural language → Display as text/voice
   ├─→ Object detections → Render highlights
   ├─→ Navigation data → Render arrows
   └─→ Translation data → Show overlays
   ↓
5. Three.js Render Loop (60 FPS)
   ├─→ Update arrow positions
   ├─→ Animate highlights
   ├─→ Apply visual effects
   └─→ Render to canvas
   ↓
6. User sees AR overlay on camera feed
```

---

## State Management Enhancement

**New State Additions**
```typescript
interface Phase2AppState extends Phase1AppState {
  // AR System
  arEnabled: boolean;
  arMode: '2D' | '2.5D' | '3D';
  detectedObjects: ObjectDetection[];
  navigationArrows: NavigationArrow[];

  // Language
  currentLanguage: Language;
  availableLanguages: Language[];
  translationMode: boolean;

  // Visual Effects
  activeEffects: VisualEffect[];
  performanceMode: 'high' | 'medium' | 'low';

  // Device
  deviceOrientation: DeviceOrientationData;
  gpsLocation?: GPSCoordinates;

  // Context
  currentLocation: 'pre-flight' | 'airport' | 'in-flight' | 'arrival';
  userIntent: 'navigation' | 'information' | 'translation' | 'general';
}
```

---

## Performance Requirements

### Metrics
- AR overlay render: 60 FPS (16.67ms per frame)
- Object detection latency: < 500ms
- Arrow update rate: 30 FPS minimum
- Animation smoothness: No dropped frames
- Memory usage: < 200MB additional (Phase 2 features)

### Optimization Strategies
1. **GPU Acceleration**: Use Three.js WebGL for all rendering
2. **Object Pooling**: Reuse arrow/highlight objects
3. **LOD System**: Lower detail for distant objects
4. **Culling**: Don't render off-screen elements
5. **Debouncing**: Throttle detection requests
6. **Lazy Loading**: Load effects only when needed
7. **Code Splitting**: Separate AR bundle from core

### Quality Settings
```typescript
enum PerformanceMode {
  HIGH = 'high',     // Full effects, 60 FPS, all features
  MEDIUM = 'medium', // Reduced effects, 30 FPS, essential features
  LOW = 'low',       // Minimal effects, 20 FPS, detection only
}
```

**Auto-detect performance mode**:
- Measure FPS for 5 seconds
- Drop quality if < 30 FPS
- Show notification to user
- Allow manual override in settings

---

## Component Architecture

### New Components

**AR Components**
```
components/ar/
├── ARCanvas.tsx           # Main Three.js canvas wrapper
├── ObjectHighlight.tsx    # Bounding box renderer
├── NavigationArrow.tsx    # 3D arrow component
├── TextOverlay.tsx        # Translation overlay
├── VisualEffect.tsx       # Effect wrapper
└── ARControls.tsx         # AR-specific controls
```

**Effect Components**
```
components/effects/
├── RippleEffect.tsx       # Touch feedback
├── ScanLineEffect.tsx     # Detection animation
├── ParticleSystem.tsx     # Ambient particles
├── GlowEffect.tsx         # Highlight glow
└── TransitionEffect.tsx   # Mode transitions
```

**Language Components**
```
components/i18n/
├── LanguageSelector.tsx   # Language picker
├── TranslatedText.tsx     # Auto-translated text
└── VoiceLanguage.tsx      # Voice language config
```

---

## New Libraries & Services

### Services
```
lib/
├── ar-service.ts          # AR coordinate mapping
├── object-detection.ts    # Detection parsing
├── navigation-service.ts  # Navigation logic
├── translation-service.ts # i18next wrapper
├── animation-service.ts   # GSAP utilities
└── performance-service.ts # Performance monitoring
```

### Hooks
```
hooks/
├── useAR.ts              # AR system hook
├── useObjectDetection.ts # Detection state
├── useNavigation.ts      # Navigation arrows
├── useLanguage.ts        # Language switching
├── useAnimations.ts      # Animation controls
└── usePerformance.ts     # Performance monitoring
```

---

## Testing Strategy

### AR Testing
- [ ] AR canvas renders on camera feed
- [ ] Object highlights match detected positions
- [ ] Arrows point correctly to destinations
- [ ] Effects play smoothly without lag
- [ ] Performance stays above 30 FPS

### Language Testing
- [ ] All UI elements translate correctly
- [ ] Voice input works in each language
- [ ] Voice output uses correct voice
- [ ] Text overlays show translations
- [ ] Language persists across sessions

### Visual Testing
- [ ] Animations are smooth and polished
- [ ] Colors match brand guidelines
- [ ] Overlays are readable in all lighting
- [ ] Effects don't obstruct camera view
- [ ] Transitions feel natural

### Cross-Device Testing
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (larger screen)
- [ ] Different screen sizes
- [ ] Portrait and landscape modes

---

## Success Metrics

### Phase 2 Complete When:
1. ✅ Three.js AR canvas renders on camera feed
2. ✅ Object detection highlights appear in real-time
3. ✅ 3D navigation arrows guide user to destinations
4. ✅ Visual effects enhance user experience
5. ✅ Multi-language support works for UI and AI
6. ✅ Performance maintains 30+ FPS on mobile
7. ✅ All animations are smooth and polished
8. ✅ AR features work seamlessly with Phase 1 foundation

### Demo Scenario
**The Ultimate Magic Moment**:
User at Delhi Airport, phone set to Hindi, points camera at confusing terminal signage. Reality Lens:
1. Detects all visible signs with green bounding boxes
2. Shows Hindi translations as overlays
3. Identifies user's Gate 23 in the distance
4. Renders a floating 3D arrow pointing toward it
5. AI explains in Hindi via voice: "आपका गेट 23 सीधे 50 मीटर आगे है" (Your Gate 23 is straight ahead 50 meters)
6. User walks forward, arrow updates in real-time
7. Smooth animations and effects throughout

---

## Risk Mitigation

### Technical Risks

**Risk: Three.js performance on mobile**
- Mitigation: Adaptive quality settings, aggressive culling, LOD system
- Fallback: 2D canvas mode without 3D effects

**Risk: Object detection accuracy**
- Mitigation: Confidence thresholds, user feedback loop
- Fallback: Manual selection mode

**Risk: GPS unreliable indoors**
- Mitigation: Visual odometry, beacon triangulation (future)
- Fallback: Relative positioning only

**Risk: Language support incomplete**
- Mitigation: Graceful fallback to English
- Fallback: Manual text input in any language

### User Experience Risks

**Risk: AR overlay too cluttered**
- Mitigation: Context-aware filtering, max 5 highlights at once
- Solution: User can tap to cycle through objects

**Risk: Arrows confusing in complex spaces**
- Mitigation: Clear labeling, distance indicators
- Solution: Simplified arrow mode toggle

**Risk: Battery drain from 3D rendering**
- Mitigation: Low power mode, reduce frame rate
- Solution: Allow AR disable, fall back to Phase 1 mode

---

## Deployment Considerations

### Bundle Size Impact
- Three.js: ~600KB gzipped
- React Three Fiber: ~150KB gzipped
- GSAP: ~50KB gzipped
- i18next: ~100KB gzipped
- **Total additional**: ~900KB

**Optimization**:
- Code splitting: Load AR bundle only when camera active
- Tree shaking: Remove unused Three.js modules
- Lazy load: Load languages on demand
- Service worker caching: Cache static assets

### Environment Variables (Phase 2)
```env
# Phase 1 variables (keep)
NEXT_PUBLIC_WS_SERVER_URL=ws://localhost:3001

# Phase 2 additions
NEXT_PUBLIC_AR_ENABLED=true
NEXT_PUBLIC_DEFAULT_LANGUAGE=en-US
NEXT_PUBLIC_PERFORMANCE_MODE=auto
NEXT_PUBLIC_MAX_OBJECTS=10
NEXT_PUBLIC_ENABLE_3D_ARROWS=true
```

---

## Next Steps (Phase 3 Preview)

Once Phase 2 is stable, Phase 3 could add:
- Advanced computer vision (depth sensing)
- Persistent AR anchors (ARCore/ARKit)
- Offline mode with cached maps
- Social features (share AR experiences)
- Accessibility enhancements (high contrast, larger text)
- Analytics and usage insights

---

## Development Roadmap

### Week 3: Core AR Infrastructure
**Day 1-2**: Three.js setup + AR canvas
**Day 3-4**: Object detection rendering
**Day 5**: Testing and optimization

### Week 4: Visual Features
**Day 1-2**: Navigation arrow system
**Day 3-4**: Visual effects + animations
**Day 5**: Polish and refinement

### Week 5: Language & Integration
**Day 1-2**: Multi-language support
**Day 3-4**: Gemini integration enhancements
**Day 5**: End-to-end testing + deployment

---

## Key Decisions Needed

1. **AR Rendering Approach**: 2D canvas vs full 3D (recommend 2.5D hybrid)
2. **Object Detection Frequency**: 0.5 FPS vs 1 FPS (balance accuracy vs latency)
3. **Arrow Style**: Flat vs 3D (recommend 3D for immersion)
4. **Language Priority**: Which 10 languages first?
5. **Performance Target**: 30 FPS vs 60 FPS (30 acceptable on mobile)
6. **Bundle Strategy**: Inline vs code-split (recommend split)

---

## Success Criteria Summary

**Must Have:**
- ✅ AR overlays render correctly on camera feed
- ✅ Object detection with bounding boxes
- ✅ 3D navigation arrows
- ✅ Basic language support (5+ languages)
- ✅ Smooth animations
- ✅ 30+ FPS performance

**Nice to Have:**
- Advanced visual effects (particles, light rays)
- 10+ language support
- GPS-based navigation
- Custom voice selection per language
- Gesture controls for AR

**Future Phase:**
- ARKit/ARCore integration
- Depth sensing
- Persistent anchors
- Social sharing

---

**Remember**: Phase 2 is about creating a magical, immersive experience that makes users say "wow." Every feature should feel polished, smooth, and purposeful. The AR overlays should enhance understanding, not create confusion. When in doubt, prioritize clarity over complexity.
