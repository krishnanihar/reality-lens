import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if session is expired (30 minutes)
 */
export function isSessionExpired(lastActivity: number): boolean {
  const THIRTY_MINUTES = 30 * 60 * 1000;
  return Date.now() - lastActivity > THIRTY_MINUTES;
}

/**
 * Compress image to JPEG base64 string
 */
export function compressImage(
  canvas: HTMLCanvasElement,
  quality: number = 0.7
): string {
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Exponential backoff for retry logic
 */
export function getBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000);
}

/**
 * Check if browser supports required features
 */
export function checkBrowserSupport(): {
  camera: boolean;
  webSocket: boolean;
  speech: boolean;
  speechSynthesis: boolean;
} {
  return {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webSocket: 'WebSocket' in window,
    speech: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
  };
}

/**
 * Get system prompt for Gemini
 */
export function getSystemPrompt(
  mode: 'camera' | 'voice' | 'both',
  location: string,
  sessionId: string
): string {
  return `You are Air India's Reality Lens AI assistant.
You can see through the passenger's camera in real-time.
You can hear their voice and respond conversationally.

Current context:
- Mode: ${mode}
- Location: ${location}
- Session ID: ${sessionId}

Your capabilities:
- Read any text you see
- Identify objects and scenes
- Provide navigation guidance
- Answer travel questions
- Stay concise (under 50 words unless explaining something complex)

Be helpful, empathetic, and proactive.`;
}
