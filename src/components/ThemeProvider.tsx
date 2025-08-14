'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"           // <- penting untuk Tailwind dark:
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange   // smoother saat toggle
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
