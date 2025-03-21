'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CSRF_HEADER } from '@/lib/csrf';

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

// Get CSRF token from meta tag - more secure than using cookies in JS
export function getCSRFTokenFromMeta(): string {
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (!meta) {
      console.warn('CSRF token meta tag not found');
      return '';
    }
    
    const token = meta.getAttribute('content') || '';
    // Validate token format (should be alphanumeric with possible - and _)
    if (!token || !/^[a-zA-Z0-9_-]+$/.test(token)) {
      console.warn('Invalid CSRF token format');
      return '';
    }
    
    return token;
  }
  return '';
}

export function useCSRFToken() {
  return useContext(CSRFContext);
}

export default function CSRFProvider({ 
  children, 
  token 
}: { 
  children: React.ReactNode;
  token?: string;
}) {
  const [csrfToken, setCSRFToken] = useState<string>(token || '');

  useEffect(() => {
    // Function to fetch new token
    const fetchNewToken = async () => {
      try {
        const nonce = getNonce();
        const fetchOptions: RequestInit = {};
        
        if (nonce) {
          fetchOptions.headers = { 'x-nonce': nonce };
        }
        
        const res = await fetch('/api/csrf', fetchOptions);
        
        // Get token from header (most reliable)
        const headerToken = res.headers.get(CSRF_HEADER);
        if (headerToken) {
          setCSRFToken(headerToken);
        } else {
          // Fallback: get from meta tag if present
          const metaToken = getCSRFTokenFromMeta();
          if (metaToken) {
            setCSRFToken(metaToken);
          }
        }
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        // After a failure, retry once after 3 seconds
        setTimeout(() => {
          fetchNewToken().catch(e => {
            console.error('Retry to fetch CSRF token also failed:', e);
          });
        }, 3000);
      }
    };
    
    // If we have a token prop, use it; otherwise get from meta or fetch
    if (!token) {
      // Get the CSRF token from the meta tag first
      const metaToken = getCSRFTokenFromMeta();
      
      if (metaToken) {
        setCSRFToken(metaToken);
      } else {
        // If not available in meta tag, fetch a new token
        fetchNewToken();
      }
    }
    
    // Set up token refresh interval (every 30 minutes)
    const intervalId = setInterval(() => {
      fetchNewToken();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => {
      clearInterval(intervalId);
    };
  }, [token]);

  return (
    <CSRFContext.Provider value={csrfToken}>
      {children}
    </CSRFContext.Provider>
  );
}