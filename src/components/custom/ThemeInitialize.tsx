'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    document.body.classList.add('theme-car-rental');
  }, []);

  return null;
}

export default ThemeInitializer;
