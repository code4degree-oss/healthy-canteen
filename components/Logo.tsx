import React from 'react';
import { Leaf } from 'lucide-react';

interface LogoProps {
  isFunky?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ isFunky = false, className = '' }) => {
  // Funky mode uses the old text style
  if (isFunky) {
    return (
      <span className={`font-heading text-lg md:text-xl cursor-pointer ${className}`}>
        THE HEALTHY CANTEEN
      </span>
    );
  }

  // Professional mode uses the PDF-inspired logo
  return (
    <div className={`flex items-center gap-3 cursor-pointer ${className}`}>
      {/* Icon Mark */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Bowl Shape */}
        <svg viewBox="0 0 100 100" className="w-full h-full text-pro-green fill-current">
          <path d="M 10 40 Q 50 100 90 40 L 85 40 Q 50 90 15 40 Z" fill="none" stroke="currentColor" strokeWidth="6" />
          <path d="M 10 40 L 90 40" stroke="currentColor" strokeWidth="4" />
          {/* THC Text Initials Stylized */}
          <text x="50" y="70" textAnchor="middle" fontSize="24" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">THC</text>
        </svg>
        {/* Leaves */}
        <Leaf size={16} className="absolute -top-1 left-0 text-pro-light-green transform -rotate-45" fill="currentColor" />
        <Leaf size={12} className="absolute -top-2 right-1 text-pro-green transform rotate-45" fill="currentColor" />
      </div>
      
      {/* Text */}
      <div className="leading-tight">
        <span className="block font-pro font-bold text-pro-text tracking-wide text-sm md:text-base">THE</span>
        <span className="block font-pro font-bold text-pro-green tracking-wide text-lg md:text-xl">HEALTHY CANTEEN</span>
      </div>
    </div>
  );
};