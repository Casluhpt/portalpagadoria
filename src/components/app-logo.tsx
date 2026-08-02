import React from 'react';
import logoAsset from "@/assets/profarma-logo.png.asset.json";

export function AppLogo({ className }: { className?: string }) {
  return (
    <img 
      src={logoAsset.url} 
      alt="Grupo Profarma 65 anos" 
      className={className} 
      style={{ objectFit: 'contain' }}
    />
  );
}
