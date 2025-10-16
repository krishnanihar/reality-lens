import { useState, useEffect, useCallback } from 'react';
import {
  ObjectDetection,
  NavigationArrow,
  ARCanvasConfig,
  PerformanceMode,
  ARMode,
} from '@/types';
import {
  parseObjectDetections,
  filterByConfidence,
  mergeDetections,
} from '@/lib/object-detection';
import { parseNavigationData, createNavigationArrows } from '@/lib/ar-service';

interface UseAROptions {
  enabled?: boolean;
  maxObjects?: number;
  minConfidence?: number;
  performanceMode?: PerformanceMode;
}

interface UseARReturn {
  detectedObjects: ObjectDetection[];
  navigationArrows: NavigationArrow[];
  config: ARCanvasConfig;
  setAREnabled: (enabled: boolean) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  processGeminiResponse: (response: any) => void;
  clearDetections: () => void;
  clearNavigation: () => void;
}

/**
 * useAR - Hook for managing AR state and processing
 */
export default function useAR(options: UseAROptions = {}): UseARReturn {
  const {
    enabled = true,
    maxObjects = 10,
    minConfidence = 0.5,
    performanceMode = 'medium',
  } = options;

  const [arEnabled, setAREnabled] = useState(enabled);
  const [arPerformanceMode, setARPerformanceMode] = useState<PerformanceMode>(performanceMode);
  const [detectedObjects, setDetectedObjects] = useState<ObjectDetection[]>([]);
  const [navigationArrows, setNavigationArrows] = useState<NavigationArrow[]>([]);

  const config: ARCanvasConfig = {
    enabled: arEnabled,
    mode: '2.5D' as ARMode,
    maxObjects,
    showDebug: false,
    performanceMode: arPerformanceMode,
  };

  /**
   * Process Gemini response for AR data
   */
  const processGeminiResponse = useCallback(
    (response: any) => {
      if (!arEnabled) return;

      try {
        // Parse object detections
        const newDetections = parseObjectDetections(response);
        const filteredDetections = filterByConfidence(newDetections, minConfidence);

        // Merge with existing detections
        setDetectedObjects((prev) => mergeDetections(prev, filteredDetections));

        // Parse navigation data
        const navigationData = parseNavigationData(response);
        if (navigationData) {
          const arrows = createNavigationArrows(navigationData);
          setNavigationArrows(arrows);
        }
      } catch (error) {
        console.error('Error processing AR response:', error);
      }
    },
    [arEnabled, minConfidence]
  );

  /**
   * Clear all detections
   */
  const clearDetections = useCallback(() => {
    setDetectedObjects([]);
  }, []);

  /**
   * Clear navigation arrows
   */
  const clearNavigation = useCallback(() => {
    setNavigationArrows([]);
  }, []);

  /**
   * Auto-cleanup stale detections
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDetectedObjects((prev) =>
        prev.filter((d) => now - d.timestamp < 5000) // 5 second timeout
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Performance monitoring and auto-adjustment
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let frameCount = 0;
    let lastTime = performance.now();

    const checkPerformance = () => {
      frameCount++;

      if (frameCount >= 60) {
        const now = performance.now();
        const elapsed = now - lastTime;
        const fps = (frameCount / elapsed) * 1000;

        // Auto-adjust performance mode
        if (fps < 20 && arPerformanceMode !== 'low') {
          console.warn('Low FPS detected, switching to low performance mode');
          setARPerformanceMode('low');
        } else if (fps > 50 && arPerformanceMode === 'low') {
          console.log('Good FPS, upgrading to medium performance mode');
          setARPerformanceMode('medium');
        }

        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(checkPerformance);
    };

    const rafId = requestAnimationFrame(checkPerformance);

    return () => cancelAnimationFrame(rafId);
  }, [arPerformanceMode]);

  return {
    detectedObjects,
    navigationArrows,
    config,
    setAREnabled,
    setPerformanceMode: setARPerformanceMode,
    processGeminiResponse,
    clearDetections,
    clearNavigation,
  };
}
