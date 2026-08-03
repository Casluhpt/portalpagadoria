import React from 'react';
import logoAsset from "@/assets/profarma-logo.png.asset.json";
import { useLogos, type LogoArea } from "@/hooks/use-logos";

export function AppLogo({ className, area = "global" }: { className?: string; area?: LogoArea }) {
  const { resolve, loading } = useLogos();
  const src = loading ? logoAsset.url : resolve(area);

  return (
    <img
      src={src}
      alt="Grupo Profarma 65 anos"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
