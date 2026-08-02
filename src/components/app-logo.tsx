import React from 'react';

export function AppLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.52 0.22 295)" />
          <stop offset="100%" stopColor="oklch(0.72 0.18 320)" />
        </linearGradient>
        <filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="12" />
          <feOffset dx="0" dy="8" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <g filter="url(#logo-shadow)">
        {/* Bloco Roxo (Fundo) */}
        <rect x="100" y="140" width="240" height="240" rx="70" fill="url(#logo-grad)" />
        
        {/* Bloco Branco/Translúcido (Sobreposto) */}
        <rect 
          x="172" y="132" 
          width="240" height="240" 
          rx="70" 
          fill="white" 
          fillOpacity="0.95" 
          stroke="oklch(0.52 0.22 295 / 0.1)"
          strokeWidth="2"
        />
        
        {/* Ícone Minimalista no Centro */}
        <path 
          d="M292 212C292 201.507 283.493 193 273 193H211C200.507 193 192 201.507 192 212V274C192 284.493 200.507 293 211 293H273C283.493 293 292 284.493 292 274V212Z" 
          stroke="oklch(0.52 0.22 295)" 
          strokeWidth="14" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          d="M217 243L242 268L292 218" 
          stroke="oklch(0.52 0.22 295)" 
          strokeWidth="14" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </g>
    </svg>
  );
}
