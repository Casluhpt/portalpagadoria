import { useState, useEffect } from 'react';

const STORAGE_KEY = 'portal-pagadoria-shortcut-legend-enabled';

export function useShortcutLegend() {
  // Inicializa como false (desativado) no primeiro acesso
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  const toggleEnabled = (value: boolean) => {
    setIsEnabled(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  };

  return { isEnabled, toggleEnabled };
}
