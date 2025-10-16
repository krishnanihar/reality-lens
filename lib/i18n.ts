import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Language, LanguageConfig } from '@/types';

// Import translations
import enUS from '@/locales/en-US/common.json';
import hiIN from '@/locales/hi-IN/common.json';
import esES from '@/locales/es-ES/common.json';

/**
 * Language configurations with metadata
 */
export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  [Language.EN_US]: {
    code: Language.EN_US,
    name: 'English (US)',
    nativeName: 'English',
    voiceSupported: true,
    rtl: false,
  },
  [Language.EN_IN]: {
    code: Language.EN_IN,
    name: 'English (India)',
    nativeName: 'English',
    voiceSupported: true,
    rtl: false,
  },
  [Language.HI_IN]: {
    code: Language.HI_IN,
    name: 'Hindi',
    nativeName: 'हिन्दी',
    voiceSupported: true,
    rtl: false,
  },
  [Language.ES_ES]: {
    code: Language.ES_ES,
    name: 'Spanish',
    nativeName: 'Español',
    voiceSupported: true,
    rtl: false,
  },
  [Language.FR_FR]: {
    code: Language.FR_FR,
    name: 'French',
    nativeName: 'Français',
    voiceSupported: true,
    rtl: false,
  },
  [Language.DE_DE]: {
    code: Language.DE_DE,
    name: 'German',
    nativeName: 'Deutsch',
    voiceSupported: true,
    rtl: false,
  },
  [Language.JA_JP]: {
    code: Language.JA_JP,
    name: 'Japanese',
    nativeName: '日本語',
    voiceSupported: true,
    rtl: false,
  },
  [Language.ZH_CN]: {
    code: Language.ZH_CN,
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    voiceSupported: true,
    rtl: false,
  },
  [Language.AR_SA]: {
    code: Language.AR_SA,
    name: 'Arabic',
    nativeName: 'العربية',
    voiceSupported: true,
    rtl: true,
  },
  [Language.IT_IT]: {
    code: Language.IT_IT,
    name: 'Italian',
    nativeName: 'Italiano',
    voiceSupported: true,
    rtl: false,
  },
};

/**
 * Available languages (only those with translations)
 */
export const AVAILABLE_LANGUAGES = [
  Language.EN_US,
  Language.HI_IN,
  Language.ES_ES,
];

/**
 * Initialize i18next
 */
i18n.use(initReactI18next).init({
  resources: {
    'en-US': { common: enUS },
    'hi-IN': { common: hiIN },
    'es-ES': { common: esES },
  },
  lng: Language.EN_US,
  fallbackLng: Language.EN_US,
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

/**
 * Change language
 */
export function changeLanguage(language: Language): Promise<any> {
  return i18n.changeLanguage(language);
}

/**
 * Get current language
 */
export function getCurrentLanguage(): Language {
  return i18n.language as Language;
}

/**
 * Get language configuration
 */
export function getLanguageConfig(language: Language): LanguageConfig {
  return LANGUAGE_CONFIGS[language];
}

/**
 * Check if language is RTL
 */
export function isRTL(language: Language): boolean {
  return LANGUAGE_CONFIGS[language].rtl;
}

/**
 * Get native language name
 */
export function getLanguageName(language: Language, native: boolean = true): string {
  const config = LANGUAGE_CONFIGS[language];
  return native ? config.nativeName : config.name;
}

/**
 * Detect browser language and return closest match
 */
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return Language.EN_US;

  const browserLang = window.navigator.language;

  // Exact match
  if (browserLang in LANGUAGE_CONFIGS) {
    return browserLang as Language;
  }

  // Partial match (e.g., 'en' matches 'en-US')
  const langPrefix = browserLang.split('-')[0];
  for (const lang of AVAILABLE_LANGUAGES) {
    if (lang.startsWith(langPrefix)) {
      return lang;
    }
  }

  return Language.EN_US;
}

/**
 * Get speech synthesis voice for language
 */
export function getVoiceForLanguage(language: Language): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  const langCode = language.split('-')[0]; // e.g., 'en' from 'en-US'

  // Try exact match first
  let voice = voices.find((v) => v.lang === language);

  // Try partial match
  if (!voice) {
    voice = voices.find((v) => v.lang.startsWith(langCode));
  }

  // Fallback to first voice
  if (!voice && voices.length > 0) {
    voice = voices[0];
  }

  return voice || null;
}

/**
 * Format distance based on language locale
 */
export function formatDistance(meters: number, language: Language): string {
  const config = LANGUAGE_CONFIGS[language];

  if (meters < 1000) {
    return `${Math.round(meters)} ${i18n.t('ar.meters', { lng: language })}`;
  } else {
    return `${(meters / 1000).toFixed(1)} ${i18n.t('ar.kilometers', { lng: language })}`;
  }
}

export default i18n;
