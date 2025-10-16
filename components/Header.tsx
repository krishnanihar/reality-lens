'use client';

import { Settings } from 'lucide-react';
import type { ConnectionQuality } from '@/types';

interface HeaderProps {
  connected: boolean;
  connectionQuality: ConnectionQuality;
  onSettingsClick: () => void;
}

export function Header({ connected, connectionQuality, onSettingsClick }: HeaderProps) {
  const getStatusColor = () => {
    if (!connected) return 'bg-gray-500';
    if (connectionQuality === 'good') return 'bg-green-500';
    if (connectionQuality === 'poor') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!connected) return 'Connecting...';
    if (connectionQuality === 'good') return 'Connected';
    if (connectionQuality === 'poor') return 'Poor Connection';
    return 'Offline';
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 gradient-ai z-50 flex items-center justify-between px-4 shadow-lg">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <span className="text-red-700 font-bold text-sm">RL</span>
        </div>
        <span className="text-white font-semibold text-lg">Reality Lens</span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
        <span className="text-white text-xs">{getStatusText()}</span>
      </div>

      {/* Settings */}
      <button
        onClick={onSettingsClick}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5 text-white" />
      </button>
    </header>
  );
}
