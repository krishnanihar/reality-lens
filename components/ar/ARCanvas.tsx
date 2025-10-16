'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ObjectDetection, NavigationArrow, ARCanvasConfig } from '@/types';

interface ARCanvasProps {
  detectedObjects: ObjectDetection[];
  navigationArrows: NavigationArrow[];
  config: ARCanvasConfig;
  videoElement?: HTMLVideoElement | null;
}

/**
 * ARCanvas - Main Three.js canvas overlay for AR features
 * Renders on top of camera feed with transparent background
 */
export default function ARCanvas({
  detectedObjects,
  navigationArrows,
  config,
  videoElement,
}: ARCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update canvas dimensions to match video element
  useEffect(() => {
    const updateDimensions = () => {
      if (videoElement) {
        setDimensions({
          width: videoElement.offsetWidth,
          height: videoElement.offsetHeight,
        });
      } else if (canvasRef.current) {
        setDimensions({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, [videoElement]);

  if (!config.enabled) {
    return null;
  }

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75,
        }}
        gl={{
          alpha: true,
          antialias: config.performanceMode === 'high',
          powerPreference: config.performanceMode === 'high' ? 'high-performance' : 'default',
        }}
        style={{
          width: dimensions.width || '100%',
          height: dimensions.height || '100%',
        }}
      >
        {/* Ambient lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />

        {/* Render detected objects as highlights */}
        {detectedObjects.slice(0, config.maxObjects).map((obj) => (
          <ObjectHighlight3D
            key={obj.id}
            detection={obj}
            dimensions={dimensions}
            performanceMode={config.performanceMode}
          />
        ))}

        {/* Render navigation arrows */}
        {navigationArrows.map((arrow) => (
          <NavigationArrow3D
            key={arrow.id}
            arrow={arrow}
            performanceMode={config.performanceMode}
          />
        ))}

        {/* Debug helpers */}
        {config.showDebug && (
          <>
            <axesHelper args={[5]} />
            <gridHelper args={[10, 10]} />
          </>
        )}
      </Canvas>

      {/* 2D Overlay layer (for text labels and bounding boxes) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 11 }}
      >
        {detectedObjects.slice(0, config.maxObjects).map((obj) => (
          <ObjectHighlight2D
            key={`2d-${obj.id}`}
            detection={obj}
            dimensions={dimensions}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * ObjectHighlight3D - 3D representation of detected objects
 * (Placeholder for future 3D enhancements)
 */
function ObjectHighlight3D({
  detection,
  dimensions,
  performanceMode,
}: {
  detection: ObjectDetection;
  dimensions: { width: number; height: number };
  performanceMode: ARCanvasConfig['performanceMode'];
}) {
  // Convert normalized coordinates to 3D space
  const x = (detection.bounds.x - 0.5) * 10;
  const y = -(detection.bounds.y - 0.5) * 10;
  const z = 0;

  return null; // 3D objects disabled for Phase 2 initial release
}

/**
 * NavigationArrow3D - 3D arrow component
 */
function NavigationArrow3D({
  arrow,
  performanceMode,
}: {
  arrow: NavigationArrow;
  performanceMode: ARCanvasConfig['performanceMode'];
}) {
  const meshRef = useRef<any>(null);

  // Animation loop
  useEffect(() => {
    if (!meshRef.current) return;

    const animate = () => {
      if (meshRef.current) {
        // Gentle bobbing animation
        meshRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.001;
        meshRef.current.rotation.z += 0.01;
      }
    };

    const intervalId = setInterval(animate, 16); // ~60fps
    return () => clearInterval(intervalId);
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={[arrow.position.x, arrow.position.y, arrow.position.z]}
      scale={arrow.scale}
    >
      <coneGeometry args={[0.5, 1.5, 8]} />
      <meshStandardMaterial
        color={arrow.color}
        emissive={arrow.color}
        emissiveIntensity={0.5}
        wireframe={performanceMode === 'low'}
      />
    </mesh>
  );
}

/**
 * ObjectHighlight2D - SVG bounding box and label overlay
 */
function ObjectHighlight2D({
  detection,
  dimensions,
}: {
  detection: ObjectDetection;
  dimensions: { width: number; height: number };
}) {
  if (dimensions.width === 0 || dimensions.height === 0) return null;

  // Convert normalized coordinates to pixel coordinates
  const x = detection.bounds.x * dimensions.width;
  const y = detection.bounds.y * dimensions.height;
  const width = detection.bounds.width * dimensions.width;
  const height = detection.bounds.height * dimensions.height;

  // Color based on object type and confidence
  const getColor = () => {
    if (detection.confidence > 0.9) return '#10B981'; // Green - high confidence
    if (detection.confidence > 0.7) return '#F59E0B'; // Amber - medium confidence
    return '#3B82F6'; // Blue - lower confidence
  };

  const color = getColor();

  return (
    <g>
      {/* Bounding box */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={color}
        strokeWidth="3"
        rx="8"
        style={{
          filter: `drop-shadow(0 0 10px ${color}66)`,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />

      {/* Corner markers */}
      <circle cx={x} cy={y} r="5" fill={color} />
      <circle cx={x + width} cy={y} r="5" fill={color} />
      <circle cx={x} cy={y + height} r="5" fill={color} />
      <circle cx={x + width} cy={y + height} r="5" fill={color} />

      {/* Label background */}
      <rect
        x={x}
        y={y - 30}
        width={Math.max(width, 100)}
        height="28"
        fill="rgba(0, 0, 0, 0.8)"
        rx="4"
        style={{ backdropFilter: 'blur(10px)' }}
      />

      {/* Label text */}
      <text
        x={x + 8}
        y={y - 10}
        fill="white"
        fontSize="14"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {detection.label}
      </text>

      {/* Confidence score */}
      <text
        x={x + 8}
        y={y - 10}
        dx={detection.label.length * 8}
        fill="rgba(255, 255, 255, 0.6)"
        fontSize="11"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {` ${(detection.confidence * 100).toFixed(0)}%`}
      </text>
    </g>
  );
}
