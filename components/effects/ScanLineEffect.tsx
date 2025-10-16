'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ScanLineEffectProps {
  active: boolean;
  color?: string;
}

/**
 * ScanLineEffect - Animated scan line for detection animation
 */
export default function ScanLineEffect({ active, color = '#10B981' }: ScanLineEffectProps) {
  const scanLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scanLineRef.current || !active) return;

    const timeline = gsap.timeline({ repeat: -1 });

    timeline.fromTo(
      scanLineRef.current,
      { top: '0%', opacity: 0.8 },
      {
        top: '100%',
        opacity: 0,
        duration: 2,
        ease: 'linear',
      }
    );

    return () => {
      timeline.kill();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        ref={scanLineRef}
        className="absolute w-full h-0.5 blur-sm"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}`,
        }}
      />
    </div>
  );
}
