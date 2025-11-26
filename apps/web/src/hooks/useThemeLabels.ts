import { useState, useEffect } from 'react';
import { getCurrentTheme, getThemeLabels, type ThemeLabels } from '@/lib/theme-labels';

export function useThemeLabels(): ThemeLabels {
  const [labels, setLabels] = useState<ThemeLabels>(() => getThemeLabels(getCurrentTheme()));

  useEffect(() => {
    const updateLabels = () => {
      const theme = getCurrentTheme();
      setLabels(getThemeLabels(theme));
    };

    // Update on mount
    updateLabels();

    // Listen for theme changes via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'initiative-tracker-theme') {
        updateLabels();
      }
    };

    // Also watch for class changes on document element
    const observer = new MutationObserver(() => {
      updateLabels();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    window.addEventListener('storage', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return labels;
}

