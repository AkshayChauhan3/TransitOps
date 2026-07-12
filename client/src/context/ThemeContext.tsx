import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';
type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  themePreference: ThemePreference;
  activeTheme: ActiveTheme;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem('themePreference');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system'; // default is system theme
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>('dark');

  useEffect(() => {
    const handleThemeChange = () => {
      const root = window.document.documentElement;
      let targetTheme: ActiveTheme = 'dark';

      if (themePreference === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        targetTheme = systemPrefersDark ? 'dark' : 'light';
      } else {
        targetTheme = themePreference;
      }

      root.classList.remove('light', 'dark');
      root.classList.add(targetTheme);
      setActiveTheme(targetTheme);
      localStorage.setItem('themePreference', themePreference);
    };

    handleThemeChange();

    // Listen for OS scheme updates if preference is system
    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => handleThemeChange();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themePreference]);

  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
  };

  return (
    <ThemeContext.Provider value={{ themePreference, activeTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
