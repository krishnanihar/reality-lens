'use client';

import React from 'react';
import { ObjectDetection, ObjectCategory } from '@/types';
import {
  FileText,
  Navigation,
  Plane,
  UtensilsCrossed,
  User,
  DoorOpen,
  ShoppingBag,
  Luggage,
  Car,
} from 'lucide-react';

interface ObjectHighlightProps {
  detection: ObjectDetection;
  onClick?: () => void;
}

/**
 * ObjectHighlight - Renders a highlighted bounding box for detected objects
 * with animated borders, labels, and category icons
 */
export default function ObjectHighlight({ detection, onClick }: ObjectHighlightProps) {
  const getColor = () => {
    if (detection.confidence > 0.9) return 'border-green-500 shadow-green-500/60';
    if (detection.confidence > 0.7) return 'border-amber-500 shadow-amber-500/40';
    return 'border-blue-500 shadow-blue-500/30';
  };

  const getIcon = () => {
    const iconProps = { size: 16, className: 'inline-block mr-1' };

    switch (detection.type) {
      case ObjectCategory.TEXT:
        return <FileText {...iconProps} />;
      case ObjectCategory.SIGN:
        return <Navigation {...iconProps} />;
      case ObjectCategory.GATE:
        return <Plane {...iconProps} />;
      case ObjectCategory.FOOD:
        return <UtensilsCrossed {...iconProps} />;
      case ObjectCategory.PERSON:
        return <User {...iconProps} />;
      case ObjectCategory.EXIT:
        return <DoorOpen {...iconProps} />;
      case ObjectCategory.AMENITY:
        return <ShoppingBag {...iconProps} />;
      case ObjectCategory.LUGGAGE:
        return <Luggage {...iconProps} />;
      case ObjectCategory.TRANSPORT:
        return <Car {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute border-2 rounded-lg ${getColor()} animate-pulse-subtle pointer-events-auto cursor-pointer transition-all hover:scale-105`}
      style={{
        left: `${detection.bounds.x * 100}%`,
        top: `${detection.bounds.y * 100}%`,
        width: `${detection.bounds.width * 100}%`,
        height: `${detection.bounds.height * 100}%`,
        boxShadow: '0 0 20px currentColor',
      }}
      onClick={onClick}
    >
      {/* Corner markers */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-current rounded-full" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-current rounded-full" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-current rounded-full" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-current rounded-full" />

      {/* Label */}
      <div className="absolute -top-8 left-0 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg text-white text-sm font-bold whitespace-nowrap">
        {getIcon()}
        {detection.label}
        <span className="ml-2 text-xs opacity-60">
          {(detection.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
