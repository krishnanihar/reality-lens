'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface GlowEffectProps {
  children: React.ReactNode;
  active: boolean;
  color?: string;
  intensity?: number;
}

/**
 * GlowEffect - Wraps component with pulsing glow effect
 */
export default function GlowEffect({
  children,
  active,
  color = '#B91C1C',
  intensity = 1,
}: GlowEffectProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glowRef.current || !active) return;

    const timeline = gsap.timeline({ repeat: -1, yoyo: true });

    timeline.to(glowRef.current, {
      filter: `drop-shadow(0 0 ${20 * intensity}px ${color}) brightness(${
        1 + 0.3 * intensity
      })`,
      duration: 1.5,
      ease: 'sine.inOut',
    });

    return () => {
      timeline.kill();
    };
  }, [active, color, intensity]);

  return (
    <div ref={glowRef} className="transition-all duration-300">
      {children}
    </div>
  );
}
