import { NavigationArrow, NavigationData, ObjectDetection } from '@/types';

/**
 * AR Service
 * Handles coordinate mapping, spatial calculations, and AR transformations
 */

/**
 * Convert screen coordinates to normalized coordinates (0-1)
 */
export function screenToNormalized(
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  return {
    x: screenX / screenWidth,
    y: screenY / screenHeight,
  };
}

/**
 * Convert normalized coordinates (0-1) to screen coordinates
 */
export function normalizedToScreen(
  normalizedX: number,
  normalizedY: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  return {
    x: normalizedX * screenWidth,
    y: normalizedY * screenHeight,
  };
}

/**
 * Convert screen coordinates to 3D space
 */
export function screenTo3D(
  normalizedX: number,
  normalizedY: number,
  depth: number = 0
): { x: number; y: number; z: number } {
  // Map from normalized 0-1 to Three.js coordinate system
  return {
    x: (normalizedX - 0.5) * 10,
    y: -(normalizedY - 0.5) * 10, // Invert Y for Three.js
    z: depth,
  };
}

/**
 * Parse navigation data from Gemini response
 */
export function parseNavigationData(response: any): NavigationData | null {
  try {
    let data: any;

    if (typeof response === 'string') {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        return null;
      }
    } else {
      data = response;
    }

    if (!data.navigation) return null;

    return {
      steps: data.navigation.steps || [],
      destination: data.navigation.destination || '',
      estimatedTime: data.navigation.estimatedTime || 0,
      totalDistance: data.navigation.totalDistance || 0,
    };
  } catch (error) {
    console.error('Error parsing navigation data:', error);
    return null;
  }
}

/**
 * Create navigation arrows from navigation data
 */
export function createNavigationArrows(
  navigationData: NavigationData,
  userPosition?: { x: number; y: number }
): NavigationArrow[] {
  const arrows: NavigationArrow[] = [];

  navigationData.steps.forEach((step, index) => {
    const arrow: NavigationArrow = {
      id: `nav-arrow-${index}`,
      type: index === 0 ? 'directional' : 'path',
      position: {
        x: 0, // Center screen horizontally
        y: 0,
        z: -step.distance / 100, // Depth based on distance
      },
      direction: {
        x: calculateDirection(step.action),
        y: 0,
        z: 0,
      },
      distance: step.distance,
      label: index === 0 ? navigationData.destination : undefined,
      color: getArrowColor(step.action),
      scale: calculateArrowScale(step.distance),
    };

    arrows.push(arrow);
  });

  return arrows;
}

/**
 * Calculate arrow direction angle based on action
 */
function calculateDirection(action: string): number {
  switch (action) {
    case 'straight':
      return 0; // North
    case 'turn_right':
      return 90; // East
    case 'turn_left':
      return -90; // West
    case 'turn_around':
      return 180; // South
    default:
      return 0;
  }
}

/**
 * Get arrow color based on action type
 */
function getArrowColor(action: string): string {
  switch (action) {
    case 'straight':
      return '#B91C1C'; // Air India Red
    case 'turn_right':
    case 'turn_left':
      return '#F59E0B'; // Amber/Orange
    case 'turn_around':
      return '#DC2626'; // Bright Red
    default:
      return '#EA580C'; // Orange
  }
}

/**
 * Calculate arrow scale based on distance
 */
function calculateArrowScale(distance: number): number {
  // Closer objects = smaller arrows (inverse scale)
  if (distance < 10) return 0.8;
  if (distance < 50) return 1.0;
  if (distance < 100) return 1.2;
  return 1.5;
}

/**
 * Estimate depth/distance from bounding box size
 * (Larger boxes = closer objects)
 */
export function estimateDepthFromSize(bounds: ObjectDetection['bounds']): number {
  const area = bounds.width * bounds.height;

  if (area > 0.3) return 1; // Very close (< 2m)
  if (area > 0.15) return 2; // Close (2-5m)
  if (area > 0.05) return 5; // Medium (5-10m)
  return 10; // Far (> 10m)
}

/**
 * Calculate angle between two points (in degrees)
 */
export function calculateAngle(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Calculate distance between two points (normalized coordinates)
 */
export function calculateDistance(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Create a mock navigation arrow for testing
 */
export function createMockNavigationArrow(): NavigationArrow {
  return {
    id: 'mock-arrow-1',
    type: 'directional',
    position: { x: 0, y: 0, z: -2 },
    direction: { x: 0, y: 0, z: 0 },
    distance: 50,
    label: 'Gate 23',
    color: '#B91C1C',
    scale: 1.0,
  };
}

/**
 * Smooth interpolation between arrow positions (for animations)
 */
export function interpolateArrowPosition(
  from: NavigationArrow['position'],
  to: NavigationArrow['position'],
  t: number // 0-1
): NavigationArrow['position'] {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  };
}

/**
 * Check if point is inside bounding box
 */
export function isPointInBounds(
  point: { x: number; y: number },
  bounds: ObjectDetection['bounds']
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * clamp(t, 0, 1);
}
