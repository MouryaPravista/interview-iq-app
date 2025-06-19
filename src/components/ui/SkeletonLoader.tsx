import React from 'react';

// A simple, reusable skeleton loader component with a pulsing animation.
// We can apply any Tailwind CSS classes to it, like h-4, w-full, rounded-md, etc.
export const SkeletonLoader = ({ className }: { className?: string }) => {
  return <div className={`animate-pulse bg-gray-700 ${className}`}></div>;
};