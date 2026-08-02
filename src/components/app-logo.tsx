import React from 'react';
import logoAsset from "@/assets/logo-pagadoria-clean.png.asset.json";

export function AppLogo({ className }: { className?: string }) {
  // We use the cleaned image asset which has a transparent background and high quality
  return (
    <img 
      src={logoAsset.url} 
      alt="Pagadoria Logo" 
      className={className} 
      style={{ objectFit: 'contain' }}
    />
  );
}
