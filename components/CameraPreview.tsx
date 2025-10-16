'use client';

import { useEffect, useRef } from 'react';
import type { CameraState } from '@/types';

interface CameraPreviewProps {
  videoElement: HTMLVideoElement | null;
  cameraState: CameraState;
  overlayMessage?: string;
}

export function CameraPreview({
  videoElement,
  cameraState,
  overlayMessage,
}: CameraPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoElement && containerRef.current) {
      // Clear any existing video elements
      containerRef.current.innerHTML = '';
      // Append the video element
      containerRef.current.appendChild(videoElement);
      videoElement.className = 'w-full h-full object-cover';
    }
  }, [videoElement]);

  if (cameraState === 'inactive') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-gray-400">
          <p className="text-lg">Camera Inactive</p>
          <p className="text-sm mt-2">Tap the camera button to start</p>
        </div>
      </div>
    );
  }

  if (cameraState === 'requesting') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-t-red-600 border-gray-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">Requesting Camera Access</p>
          <p className="text-sm mt-2 text-gray-400">
            Please allow camera access to use visual features
          </p>
        </div>
      </div>
    );
  }

  if (cameraState === 'error') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-red-400">
          <p className="text-lg">Camera Not Available</p>
          <p className="text-sm mt-2">You can still use voice-only mode</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* AI Active Indicator */}
      {(cameraState === 'active' || cameraState === 'processing') && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-medium">AI Active</span>
        </div>
      )}

      {/* Processing Indicator */}
      {cameraState === 'processing' && (
        <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none" />
      )}

      {/* Overlay Message */}
      {overlayMessage && (
        <div className="absolute bottom-20 left-0 right-0 px-4">
          <div className="glass-effect rounded-lg p-4 text-white shadow-2xl">
            <p className="text-sm leading-relaxed">{overlayMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
