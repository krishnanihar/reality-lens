import type { CameraConfig, CameraState } from '@/types';
import { compressImage } from './utils';

type FrameCallback = (frame: string) => void;
type StateCallback = (state: CameraState) => void;
type ErrorCallback = (error: Error) => void;

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private captureInterval: NodeJS.Timeout | null = null;
  private config: CameraConfig;
  private state: CameraState = 'inactive';

  private onFrameCallback?: FrameCallback;
  private onStateCallback?: StateCallback;
  private onErrorCallback?: ErrorCallback;

  constructor(config: CameraConfig) {
    this.config = config;
  }

  /**
   * Initialize camera and start capturing
   */
  async start(preferredCamera: 'front' | 'back' = 'back'): Promise<void> {
    try {
      this.setState('requesting');

      // Request camera permission and get stream
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: this.config.resolution.width },
          height: { ideal: this.config.resolution.height },
          facingMode: preferredCamera === 'back' ? 'environment' : 'user',
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create video element
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
      }

      this.videoElement.srcObject = this.stream;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (this.videoElement) {
          this.videoElement.onloadedmetadata = () => {
            this.videoElement?.play();
            resolve();
          };
        }
      });

      // Create canvas for frame capture
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = this.config.resolution.width;
        this.canvasElement.height = this.config.resolution.height;
        this.context = this.canvasElement.getContext('2d');
      }

      this.setState('active');
      this.startFrameCapture();
    } catch (error) {
      this.setState('error');
      this.handleError(error);
    }
  }

  /**
   * Start capturing frames at specified interval
   */
  private startFrameCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }

    const intervalMs = 1000 / this.config.frameRate;

    this.captureInterval = setInterval(() => {
      this.captureFrame();
    }, intervalMs);
  }

  /**
   * Capture a single frame
   */
  private captureFrame(): void {
    if (
      !this.videoElement ||
      !this.canvasElement ||
      !this.context ||
      this.state !== 'active'
    ) {
      return;
    }

    try {
      // Draw video frame to canvas
      this.context.drawImage(
        this.videoElement,
        0,
        0,
        this.config.resolution.width,
        this.config.resolution.height
      );

      // Compress and convert to base64
      const frameData = compressImage(this.canvasElement, this.config.quality);

      // Notify callback
      if (this.onFrameCallback) {
        this.onFrameCallback(frameData);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get current video element for preview
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Get current stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Manually capture a single frame (on-demand)
   */
  captureSnapshot(): string | null {
    if (
      !this.videoElement ||
      !this.canvasElement ||
      !this.context ||
      this.state !== 'active'
    ) {
      return null;
    }

    try {
      this.context.drawImage(
        this.videoElement,
        0,
        0,
        this.config.resolution.width,
        this.config.resolution.height
      );

      return compressImage(this.canvasElement, this.config.quality);
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(camera: 'front' | 'back'): Promise<void> {
    this.stop();
    await this.start(camera);
  }

  /**
   * Pause frame capture (keep camera active)
   */
  pause(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  /**
   * Resume frame capture
   */
  resume(): void {
    if (this.state === 'active') {
      this.startFrameCapture();
    }
  }

  /**
   * Stop camera and release resources
   */
  stop(): void {
    // Stop frame capture
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    // Stop video stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Clear video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.setState('inactive');
  }

  /**
   * Check camera permission status
   */
  async checkPermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      return result.state as PermissionState;
    } catch {
      // Fallback if permissions API not supported
      return 'prompt';
    }
  }

  /**
   * Get available cameras
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'videoinput');
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  /**
   * Set state and notify
   */
  private setState(newState: CameraState): void {
    this.state = newState;
    if (this.onStateCallback) {
      this.onStateCallback(newState);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error('Camera error');
    if (this.onErrorCallback) {
      this.onErrorCallback(err);
    }
  }

  /**
   * Set callback handlers
   */
  onFrame(callback: FrameCallback): void {
    this.onFrameCallback = callback;
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
  getState(): CameraState {
    return this.state;
  }

  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.state === 'active';
  }
}
