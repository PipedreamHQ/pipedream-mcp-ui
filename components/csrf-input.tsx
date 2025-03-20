'use client';

import { useEffect, useState } from 'react';

/**
 * CSRF Input component for forms
 * This adds a hidden input with the CSRF token value
 */
export function CSRFInput() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // Get token from cookie
    const token = getCSRFTokenFromCookie();
    if (token) {
      setCsrfToken(token);
    } else {
      // Fetch a new token if not found
      fetch('/api/csrf')
        .then(() => {
          // Get the newly set token from cookie
          const newToken = getCSRFTokenFromCookie();
          if (newToken) {
            setCsrfToken(newToken);
          }
        })
        .catch(err => {
          console.error('Failed to fetch CSRF token:', err);
        });
    }
  }, []);

  return <input type="hidden" name="_csrf" value={csrfToken} />;
}

/**
 * Get the CSRF token from the cookie
 */
function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}