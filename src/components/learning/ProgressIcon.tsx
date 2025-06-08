import React from 'react';
import { Check } from 'lucide-react';

interface ProgressIconProps {
  status: 'not_started' | 'in_progress' | 'completed';
  size?: number;
  className?: string;
}

export default function ProgressIcon({ status, size = 20, className = "" }: ProgressIconProps) {
  const iconSize = size;
  
  switch (status) {
    case 'completed':
      return (
        <div 
          className={`flex items-center justify-center bg-green-500 rounded-full shadow-sm ${className}`}
          style={{ width: iconSize, height: iconSize }}
        >
          <Check className="text-white" size={iconSize * 0.6} strokeWidth={2.5} />
        </div>
      );
      
    case 'in_progress':
      return (
        <div 
          className={`relative ${className}`}
          style={{ width: iconSize, height: iconSize }}
        >
          <div 
            className="absolute inset-0 border-2 border-gray-300 rounded-full bg-white"
            style={{ width: iconSize, height: iconSize }}
          />
          <div 
            className="absolute top-0 left-0 bg-green-500 overflow-hidden"
            style={{ 
              width: iconSize, 
              height: iconSize,
              borderRadius: '50%',
              clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)'
            }}
          />
        </div>
      );
      
    default: 
      return (
        <div 
          className={`border-2 border-gray-300 rounded-full bg-white shadow-sm ${className}`}
          style={{ width: iconSize, height: iconSize }}
        />
      );
  }
}
