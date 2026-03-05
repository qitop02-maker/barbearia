import React from 'react';

interface DiscountBadgeProps {
  original: number;
  discounted: number;
  className?: string;
}

export const DiscountBadge: React.FC<DiscountBadgeProps> = ({ original, discounted, className = '' }) => {
  const percentage = Math.round(((original - discounted) / original) * 100);
  
  return (
    <div className={`bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full ${className}`}>
      -{percentage}%
    </div>
  );
};
