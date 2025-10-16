'use client';

import { Mic, MicOff, Camera, CameraOff, Keyboard } from 'lucide-react';
import type { CameraState, AudioState } from '@/types';

interface ControlsBarProps {
  cameraState: CameraState;
  audioState: AudioState;
  onCameraToggle: () => void;
  onMicToggle: () => void;
  onKeyboardToggle: () => void;
}

export function ControlsBar({
  cameraState,
  audioState,
  onCameraToggle,
  onMicToggle,
  onKeyboardToggle,
}: ControlsBarProps) {
  const isCameraActive = cameraState === 'active' || cameraState === 'processing';
  const isAudioActive = audioState === 'listening' || audioState === 'speaking';

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 glass-effect z-40 flex items-center justify-center space-x-8 px-4">
      {/* Microphone Button */}
      <button
        onClick={onMicToggle}
        className={`p-4 rounded-full transition-all ${
          isAudioActive
            ? 'bg-red-600 animate-pulse shadow-lg shadow-red-500/50'
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
        aria-label={isAudioActive ? 'Stop microphone' : 'Start microphone'}
      >
        {isAudioActive ? (
          <Mic className="w-6 h-6 text-white" />
        ) : (
          <MicOff className="w-6 h-6 text-gray-300" />
        )}
      </button>

      {/* Camera Button */}
      <button
        onClick={onCameraToggle}
        className={`p-5 rounded-full transition-all ${
          isCameraActive
            ? 'bg-red-600 shadow-lg shadow-red-500/50'
            : 'bg-gray-700 hover:bg-gray-600'
        } relative`}
        aria-label={isCameraActive ? 'Stop camera' : 'Start camera'}
      >
        {isCameraActive ? (
          <>
            <Camera className="w-7 h-7 text-white" />
            {cameraState === 'processing' && (
              <div className="absolute inset-0 rounded-full border-2 border-white animate-ping" />
            )}
          </>
        ) : (
          <CameraOff className="w-7 h-7 text-gray-300" />
        )}
      </button>

      {/* Keyboard Button */}
      <button
        onClick={onKeyboardToggle}
        className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
        aria-label="Open keyboard"
      >
        <Keyboard className="w-6 h-6 text-gray-300" />
      </button>
    </div>
  );
}
