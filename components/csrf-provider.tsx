'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Create a context for the CSRF token
export const CSRFContext = createContext<string>('');

// Get nonce from meta tag for CSP compliance
export function getNonce(): string {
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="csp-nonce"]');
    return meta ? meta.getAttribute('content') || '' : '';
  }
  return '';
}

export function useCSRFToken() {
  return useContext(CSRFContext);
}

export default function CSRFProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCSRFToken] = useState<string>('');

  useEffect(() => {
    // Get the token from cookies
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || '';
      }
      return '';
    };

    // Get the CSRF token from the cookie
    const token = getCookieValue('XSRF-TOKEN');
    
    // If we already have the token in cookies, use it
    if (token) {
      setCSRFToken(token);
    } else {
      // Otherwise fetch from the API to set the cookie
      // Add CSP nonce to script elements
      const nonce = getNonce();
      const fetchOptions: RequestInit = {};
      
      // If we have a nonce, add it to the request headers
      if (nonce) {
        fetchOptions.headers = { 'x-nonce': nonce };
      }
      
      fetch('/api/csrf', fetchOptions)
        .then(res => {
          // After fetching, the cookie should be set
          // Get the token from the response header
          const headerToken = res.headers.get('X-CSRF-Token');
          if (headerToken) {
            setCSRFToken(headerToken);
          } else {
            // Or try to get it from cookies again
            setCSRFToken(getCookieValue('XSRF-TOKEN'));
          }
        })
        .catch(err => {
          console.error('Failed to fetch CSRF token:', err);
        });
    }
  }, []);

  return (
    <CSRFContext.Provider value={csrfToken}>
      {children}
    </CSRFContext.Provider>
  );
}