import type { AudioState, VoiceConfig } from '@/types';

type TranscriptCallback = (transcript: string, isFinal: boolean) => void;
type StateCallback = (state: AudioState) => void;
type ErrorCallback = (error: Error) => void;

// Define types for browser-specific APIs
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export class VoiceService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private config: VoiceConfig;
  private state: AudioState = 'idle';
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private noSpeechTimeout: NodeJS.Timeout | null = null;

  private onTranscriptCallback?: TranscriptCallback;
  private onStateCallback?: StateCallback;
  private onErrorCallback?: ErrorCallback;

  constructor(config: VoiceConfig) {
    this.config = config;
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  /**
   * Initialize Speech Recognition
   */
  private initializeSpeechRecognition(): void {
    if (typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.lang = this.config.language;

    this.recognition.onstart = () => {
      this.setState('listening');
      this.startNoSpeechTimer();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.clearNoSpeechTimer();

      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      if (this.onTranscriptCallback) {
        this.onTranscriptCallback(transcript, isFinal);
      }

      if (isFinal && !this.config.continuous) {
        this.setState('idle');
      } else if (!isFinal) {
        this.startNoSpeechTimer();
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.setState('error');
      this.clearNoSpeechTimer();
      this.handleError(new Error(`Speech recognition error: ${event.error}`));
    };

    this.recognition.onend = () => {
      if (this.state === 'listening' && this.config.continuous) {
        // Auto-restart if continuous mode
        try {
          this.recognition.start();
        } catch {
          // Already started or error - ignore
        }
      } else {
        this.setState('idle');
      }
      this.clearNoSpeechTimer();
    };
  }

  /**
   * Initialize Speech Synthesis
   */
  private initializeSpeechSynthesis(): void {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.warn('Speech synthesis not supported');
    }
  }

  /**
   * Start listening for voice input
   */
  startListening(): void {
    if (!this.recognition) {
      this.handleError(new Error('Speech recognition not available'));
      return;
    }

    try {
      if (this.state === 'listening') {
        return; // Already listening
      }

      this.recognition.start();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
      this.setState('idle');
      this.clearNoSpeechTimer();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Speak text using speech synthesis
   */
  speak(text: string, rate: number = 1.0): void {
    if (!this.synthesis) {
      this.handleError(new Error('Speech synthesis not available'));
      return;
    }

    // Cancel any ongoing speech
    this.stopSpeaking();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = rate;
    this.currentUtterance.lang = this.config.language;

    this.currentUtterance.onstart = () => {
      this.setState('speaking');
    };

    this.currentUtterance.onend = () => {
      this.setState('idle');
      this.currentUtterance = null;
    };

    this.currentUtterance.onerror = (event) => {
      this.setState('error');
      this.handleError(new Error(`Speech synthesis error: ${event.error}`));
      this.currentUtterance = null;
    };

    this.synthesis.speak(this.currentUtterance);
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (!this.synthesis) return;

    try {
      this.synthesis.cancel();
      this.setState('idle');
      this.currentUtterance = null;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Pause speaking
   */
  pauseSpeaking(): void {
    if (!this.synthesis) return;

    try {
      this.synthesis.pause();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Resume speaking
   */
  resumeSpeaking(): void {
    if (!this.synthesis) return;

    try {
      this.synthesis.resume();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.state === 'speaking' && this.synthesis?.speaking === true;
  }

  /**
   * Check if currently listening
   */
  isListening(): boolean {
    return this.state === 'listening';
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];

    return this.synthesis.getVoices();
  }

  /**
   * Set voice by name
   */
  setVoice(voiceName: string): void {
    if (!this.currentUtterance) return;

    const voices = this.getAvailableVoices();
    const voice = voices.find((v) => v.name === voiceName);

    if (voice) {
      this.currentUtterance.voice = voice;
    }
  }

  /**
   * Check microphone permission
   */
  async checkPermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      return result.state as PermissionState;
    } catch {
      return 'prompt';
    }
  }

  /**
   * Start no-speech timeout (5 seconds)
   */
  private startNoSpeechTimer(): void {
    this.clearNoSpeechTimer();

    this.noSpeechTimeout = setTimeout(() => {
      if (this.state === 'listening' && this.onErrorCallback) {
        this.onErrorCallback(new Error("I didn't hear that"));
      }
      this.stopListening();
    }, 5000);
  }

  /**
   * Clear no-speech timeout
   */
  private clearNoSpeechTimer(): void {
    if (this.noSpeechTimeout) {
      clearTimeout(this.noSpeechTimeout);
      this.noSpeechTimeout = null;
    }
  }

  /**
   * Set state and notify
   */
  private setState(newState: AudioState): void {
    this.state = newState;
    if (this.onStateCallback) {
      this.onStateCallback(newState);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error('Voice error');
    if (this.onErrorCallback) {
      this.onErrorCallback(err);
    }
  }

  /**
   * Set callback handlers
   */
  onTranscript(callback: TranscriptCallback): void {
    this.onTranscriptCallback = callback;
  }

  onState(callback: StateCallback): void {
    this.onStateCallback = callback;
  }

  onError(callback: ErrorCallback): void {
    this.onErrorCallback = callback;
  }

  /**
   * Get current state
   */
  getState(): AudioState {
    return this.state;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopListening();
    this.stopSpeaking();
    this.clearNoSpeechTimer();
  }
}
