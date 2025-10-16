'use client';

import { useState, useEffect } from 'react';
import type { UserPreferences } from '@/types';

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredCamera: 'back',
  voiceEnabled: true,
  continuousListening: false,
  textSize: 'normal',
  language: 'en-US',
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Load preferences from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('reality-lens-preferences');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch (error) {
          console.error('Failed to parse preferences:', error);
        }
      }
    }
  }, []);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('reality-lens-preferences', JSON.stringify(newPreferences));
    }
  };

  return { preferences, updatePreferences };
}
