#!/bin/bash

# Reality Lens Phase 2 Activation Script
# Run this from /Users/krishnaniharsunkara/Desktop/Vision/

echo "🚀 Activating Reality Lens Phase 2..."
echo ""

cd reality-lens

# Check if already activated
if [ -f "app/page-phase2.tsx" ]; then
    echo "✅ Phase 2 files found. Activating..."
    echo ""

    # Backup Phase 1
    if [ -f "app/page.tsx" ] && [ ! -f "app/page-phase1-backup.tsx" ]; then
        echo "📦 Backing up Phase 1..."
        mv app/page.tsx app/page-phase1-backup.tsx
    fi

    # Activate Phase 2
    echo "✨ Activating Phase 2..."
    mv app/page-phase2.tsx app/page.tsx

    echo ""
    echo "✅ Phase 2 Activated!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Terminal 1: cd server && npm run dev"
    echo "2. Terminal 2: npm run dev"
    echo "3. Open http://localhost:3000"
    echo ""
    echo "🎯 Test Features:"
    echo "  - Click globe icon (top-right) to change language"
    echo "  - Enable camera to see AR features"
    echo "  - Watch for 'AR ACTIVE' badge (bottom-right)"
    echo "  - Observe scan line effect during processing"
    echo ""
    echo "📚 Documentation:"
    echo "  - README-PHASE2.md - Complete guide"
    echo "  - PHASE2-ACTIVATION.md - Detailed activation steps"
    echo "  - phase2-implementation-summary.md - What was built"
    echo ""
else
    echo "❌ Phase 2 files not found!"
    echo "Expected: app/page-phase2.tsx"
    echo ""
    echo "Current files in app/:"
    ls -la app/ | grep page
    echo ""
fi
