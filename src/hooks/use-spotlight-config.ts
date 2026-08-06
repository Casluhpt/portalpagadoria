import { useState, useEffect } from 'react';

const STORAGE_KEY = 'portal-pagadoria-spotlight-config';

export type SpotlightConfig = {
  enabled: boolean;
  intensity: number; // 0 to 100
  radius: number; // 200 to 1000
};

const DEFAULT_CONFIG: SpotlightConfig = {
  enabled: true,
  intensity: 8,
  radius: 600,
};

export function useSpotlightConfig() {
  const [config, setConfig] = useState<SpotlightConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const updateConfig = (newConfig: Partial<SpotlightConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { config, updateConfig };
}
