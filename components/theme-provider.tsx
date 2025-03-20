'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Get the nonce from meta tag if it exists
  const getNonce = () => {
    if (typeof document !== 'undefined') {
      const meta = document.querySelector('meta[name="csp-nonce"]');
      return meta ? meta.getAttribute('content') : '';
    }
    return '';
  };

  return (
    <NextThemesProvider
      {...props}
      // Apply nonce to inline scripts for CSP compliance
      scriptProps={{ nonce: getNonce() }}
    >
      {children}
    </NextThemesProvider>
  );
}
