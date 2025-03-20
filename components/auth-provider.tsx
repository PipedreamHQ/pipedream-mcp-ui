'use client';

import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';

export default function AuthProvider({
  children,
  publishableKey
}: {
  children: React.ReactNode;
  publishableKey?: string;
}) {
  // Get the nonce from a meta tag if available
  let nonce = '';
  if (typeof document !== 'undefined') {
    const nonceMetaTag = document.querySelector('meta[name="csp-nonce"]');
    if (nonceMetaTag) {
      nonce = nonceMetaTag.getAttribute('content') || '';
    }
  }
  
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90",
          card: "shadow-lg",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}