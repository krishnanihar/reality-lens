'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { Language } from '@/types';
import {
  AVAILABLE_LANGUAGES,
  getLanguageName,
  changeLanguage,
} from '@/lib/i18n';

interface LanguageSelectorProps {
  onLanguageChange?: (language: Language) => void;
}

/**
 * LanguageSelector - UI component for selecting app language
 */
export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = i18n.language as Language;

  const handleLanguageChange = async (language: Language) => {
    await changeLanguage(language);
    setIsOpen(false);
    onLanguageChange?.(language);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', language);
    }
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        aria-label={t('settings.language')}
      >
        <Globe size={20} />
        <span className="hidden sm:inline font-medium">
          {getLanguageName(currentLanguage, true)}
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-white/10 z-50 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-sm text-gray-400 font-medium">
                {t('settings.language')}
              </div>

              {AVAILABLE_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-white">
                      {getLanguageName(lang, true)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getLanguageName(lang, false)}
                    </span>
                  </div>

                  {currentLanguage === lang && (
                    <Check size={18} className="text-green-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Coming soon section */}
            <div className="border-t border-white/10 p-2">
              <div className="px-3 py-2 text-xs text-gray-500">
                Coming soon: French, German, Japanese, Chinese, Arabic, Italian
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
