'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface RippleEffectProps {
  x: number;
  y: number;
  color?: string;
  onComplete?: () => void;
}

/**
 * RippleEffect - Animated ripple at touch/click position
 */
export default function RippleEffect({
  x,
  y,
  color = '#B91C1C',
  onComplete,
}: RippleEffectProps) {
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rippleRef.current) return;

    const timeline = gsap.timeline({
      onComplete: () => onComplete?.(),
    });

    timeline.to(rippleRef.current, {
      scale: 3,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
    });

    return () => {
      timeline.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={rippleRef}
      className="absolute rounded-full border-2 pointer-events-none"
      style={{
        left: x,
        top: y,
        width: 40,
        height: 40,
        marginLeft: -20,
        marginTop: -20,
        borderColor: color,
        opacity: 0.8,
      }}
    />
  );
}
