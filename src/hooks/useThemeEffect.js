import { useEffect } from 'react';

/**
 * Hook to apply theme changes to the document body
 * Handles the side effect of setting the data-theme attribute
 * @param {string} theme - Current theme ('dark' or 'light')
 */
export function useThemeEffect(theme) {
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);
}
