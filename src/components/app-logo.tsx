import React from 'react';
// Logo imported directly from public for reliability

export function AppLogo({ className }: { className?: string }) {
  // We use the cleaned image asset which has a transparent background and high quality
  return (
    <img 
      src="/profarma.png" 
      alt="Pagadoria Logo" 
      className={className} 
      style={{ objectFit: 'contain' }}
    />
  );
}
