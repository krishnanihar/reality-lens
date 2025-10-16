import { ObjectDetection, ObjectCategory, EnhancedGeminiResponse } from '@/types';

/**
 * Object Detection Service
 * Parses Gemini responses for object detection data
 * and manages detected objects state
 */

/**
 * Parse Gemini response for object detection data
 */
export function parseObjectDetections(response: any): ObjectDetection[] {
  try {
    // Handle both plain text and JSON responses
    let data: any;

    if (typeof response === 'string') {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        return [];
      }
    } else {
      data = response;
    }

    // Extract objects array from response
    const objects = data.objects || [];

    return objects.map((obj: any, index: number) => ({
      id: obj.id || `detection-${Date.now()}-${index}`,
      type: parseObjectCategory(obj.type || obj.label),
      label: obj.label || obj.type || 'Unknown',
      bounds: {
        x: obj.bounds?.x || obj.x || 0,
        y: obj.bounds?.y || obj.y || 0,
        width: obj.bounds?.width || obj.w || 0.1,
        height: obj.bounds?.height || obj.h || 0.1,
      },
      confidence: obj.confidence || obj.score || 0.5,
      metadata: obj.metadata || {},
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error parsing object detections:', error);
    return [];
  }
}

/**
 * Parse string to ObjectCategory enum
 */
function parseObjectCategory(type: string): ObjectCategory {
  const normalized = type.toLowerCase().replace(/[^a-z]/g, '');

  switch (normalized) {
    case 'text':
    case 'label':
    case 'sign':
      return ObjectCategory.TEXT;
    case 'signage':
    case 'directional':
      return ObjectCategory.SIGN;
    case 'gate':
    case 'boarding':
      return ObjectCategory.GATE;
    case 'food':
    case 'restaurant':
    case 'dining':
      return ObjectCategory.FOOD;
    case 'person':
    case 'people':
      return ObjectCategory.PERSON;
    case 'exit':
    case 'door':
      return ObjectCategory.EXIT;
    case 'amenity':
    case 'restroom':
    case 'shop':
      return ObjectCategory.AMENITY;
    case 'luggage':
    case 'baggage':
    case 'suitcase':
      return ObjectCategory.LUGGAGE;
    case 'transport':
    case 'vehicle':
    case 'bus':
    case 'taxi':
      return ObjectCategory.TRANSPORT;
    default:
      return ObjectCategory.TEXT;
  }
}

/**
 * Filter detections by confidence threshold
 */
export function filterByConfidence(
  detections: ObjectDetection[],
  minConfidence: number = 0.5
): ObjectDetection[] {
  return detections.filter((d) => d.confidence >= minConfidence);
}

/**
 * Sort detections by confidence (highest first)
 */
export function sortByConfidence(detections: ObjectDetection[]): ObjectDetection[] {
  return [...detections].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Deduplicate detections that are too close together
 */
export function deduplicateDetections(
  detections: ObjectDetection[],
  threshold: number = 0.1
): ObjectDetection[] {
  const result: ObjectDetection[] = [];

  for (const detection of detections) {
    const isDuplicate = result.some((existing) => {
      const dx = Math.abs(detection.bounds.x - existing.bounds.x);
      const dy = Math.abs(detection.bounds.y - existing.bounds.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance < threshold && detection.type === existing.type;
    });

    if (!isDuplicate) {
      result.push(detection);
    }
  }

  return result;
}

/**
 * Merge old and new detections, keeping fresh ones
 */
export function mergeDetections(
  oldDetections: ObjectDetection[],
  newDetections: ObjectDetection[],
  maxAge: number = 2000 // 2 seconds
): ObjectDetection[] {
  const now = Date.now();

  // Filter out stale detections
  const freshOld = oldDetections.filter((d) => now - d.timestamp < maxAge);

  // Merge with new detections (new ones take precedence)
  const allDetections = [...newDetections, ...freshOld];

  // Deduplicate
  return deduplicateDetections(allDetections);
}

/**
 * Calculate intersection over union (IoU) for two bounding boxes
 */
export function calculateIoU(
  box1: ObjectDetection['bounds'],
  box2: ObjectDetection['bounds']
): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const unionArea = box1Area + box2Area - intersectionArea;

  return unionArea > 0 ? intersectionArea / unionArea : 0;
}

/**
 * Find the detection closest to a point (e.g., user tap)
 */
export function findClosestDetection(
  detections: ObjectDetection[],
  point: { x: number; y: number } // normalized coordinates
): ObjectDetection | null {
  if (detections.length === 0) return null;

  let closest: ObjectDetection | null = null;
  let minDistance = Infinity;

  for (const detection of detections) {
    const centerX = detection.bounds.x + detection.bounds.width / 2;
    const centerY = detection.bounds.y + detection.bounds.height / 2;

    const dx = centerX - point.x;
    const dy = centerY - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closest = detection;
    }
  }

  return closest;
}

/**
 * Format detection info for display
 */
export function formatDetectionInfo(detection: ObjectDetection): string {
  const confidence = (detection.confidence * 100).toFixed(0);
  const category = detection.type.replace('_', ' ').toUpperCase();

  return `${detection.label} (${category}, ${confidence}% confident)`;
}

/**
 * Create mock detections for testing
 */
export function createMockDetections(): ObjectDetection[] {
  return [
    {
      id: 'mock-1',
      type: ObjectCategory.GATE,
      label: 'Gate 23',
      bounds: { x: 0.4, y: 0.3, width: 0.2, height: 0.15 },
      confidence: 0.95,
      metadata: { gateNumber: '23', status: 'boarding' },
      timestamp: Date.now(),
    },
    {
      id: 'mock-2',
      type: ObjectCategory.SIGN,
      label: 'Exit →',
      bounds: { x: 0.1, y: 0.2, width: 0.15, height: 0.1 },
      confidence: 0.88,
      metadata: { direction: 'right' },
      timestamp: Date.now(),
    },
    {
      id: 'mock-3',
      type: ObjectCategory.FOOD,
      label: 'Restaurant',
      bounds: { x: 0.7, y: 0.5, width: 0.18, height: 0.2 },
      confidence: 0.82,
      metadata: { open: true },
      timestamp: Date.now(),
    },
  ];
}
