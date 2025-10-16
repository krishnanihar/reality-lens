'use client';

import React, { useEffect, useRef } from 'react';
import { NavigationArrow as NavigationArrowType } from '@/types';
import { ArrowUp, ArrowUpRight, ArrowRight, CornerRightDown } from 'lucide-react';
import gsap from 'gsap';

interface NavigationArrowProps {
  arrow: NavigationArrowType;
  onClick?: () => void;
}

/**
 * NavigationArrow - 2D animated arrow pointing to destinations
 * Uses GSAP for smooth animations
 */
export default function NavigationArrow({ arrow, onClick }: NavigationArrowProps) {
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!arrowRef.current) return;

    // Entrance animation
    gsap.from(arrowRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
    });

    // Floating animation loop
    gsap.to(arrowRef.current, {
      y: '+=10',
      duration: 1.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // Pulse glow animation
    gsap.to(arrowRef.current, {
      filter: 'drop-shadow(0 0 20px currentColor) brightness(1.3)',
      duration: 1.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    return () => {
      gsap.killTweensOf(arrowRef.current);
    };
  }, []);

  const getArrowIcon = () => {
    const iconSize = arrow.scale * 48;

    switch (arrow.type) {
      case 'directional':
        return <ArrowUp size={iconSize} strokeWidth={3} />;
      case 'path':
        return <ArrowUpRight size={iconSize} strokeWidth={2.5} />;
      case 'turn':
        return <CornerRightDown size={iconSize} strokeWidth={2.5} />;
      default:
        return <ArrowRight size={iconSize} strokeWidth={3} />;
    }
  };

  const getArrowSize = () => {
    // Scale based on distance (closer = smaller)
    const baseSize = arrow.type === 'directional' ? 80 : 60;
    return baseSize * arrow.scale;
  };

  const getOpacity = () => {
    // Fade based on distance
    if (arrow.distance < 5) return 1;
    if (arrow.distance < 20) return 0.8;
    return 0.6;
  };

  return (
    <div
      ref={arrowRef}
      className="absolute pointer-events-auto cursor-pointer transition-transform hover:scale-110"
      style={{
        left: '50%',
        top: '30%',
        transform: `translate(-50%, -50%) rotate(${arrow.direction.x}deg) scale(${arrow.scale})`,
        color: arrow.color,
        opacity: getOpacity(),
        width: `${getArrowSize()}px`,
        height: `${getArrowSize()}px`,
      }}
      onClick={onClick}
    >
      {/* Arrow icon */}
      <div className="relative w-full h-full flex items-center justify-center">
        {getArrowIcon()}

        {/* Distance indicator */}
        {arrow.distance > 0 && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold whitespace-nowrap">
            {arrow.distance < 1000
              ? `${Math.round(arrow.distance)}m`
              : `${(arrow.distance / 1000).toFixed(1)}km`}
          </div>
        )}

        {/* Label */}
        {arrow.label && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 rounded-lg text-white text-sm font-bold whitespace-nowrap shadow-lg">
            {arrow.label}
          </div>
        )}
      </div>

      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-50"
        style={{ backgroundColor: arrow.color }}
      />
    </div>
  );
}

/**
 * NavigationArrowGroup - Renders multiple arrows for complex navigation
 */
interface NavigationArrowGroupProps {
  arrows: NavigationArrowType[];
  onArrowClick?: (arrowId: string) => void;
}

export function NavigationArrowGroup({ arrows, onArrowClick }: NavigationArrowGroupProps) {
  if (arrows.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {arrows.map((arrow) => (
        <NavigationArrow
          key={arrow.id}
          arrow={arrow}
          onClick={() => onArrowClick?.(arrow.id)}
        />
      ))}
    </div>
  );
}
