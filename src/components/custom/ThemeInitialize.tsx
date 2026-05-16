'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {document.documentElement.classList.add('theme-inginuity');
    localStorage.theme = 'inginuity';
  }, []);

  return null;
}

export default ThemeInitializer;