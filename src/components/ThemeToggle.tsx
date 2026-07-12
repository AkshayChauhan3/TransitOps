'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="btn-primary" style={{ width: '120px' }}>Loading...</button>;
  }

  return (
    <button
      className="btn-primary"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      style={{ minWidth: '120px' }}
    >
      {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}
