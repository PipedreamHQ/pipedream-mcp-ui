'use client';

import { useCSRFToken } from '@/components/csrf-provider';

/**
 * Helper function to get CSRF token from cookie
 */
function getCSRFTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  
  const getCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || '';
    }
    return '';
  };

  return getCookieValue('XSRF-TOKEN');
}

/**
 * Wrapper around fetch that automatically includes the CSRF token
 * in the request headers for state-changing methods (POST, PUT, DELETE, PATCH)
 */
export async function fetchWithCSRF(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get the CSRF token from cookies
  const csrfToken = getCSRFTokenFromCookie();
  
  const method = options.method || 'GET';
  const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
  
  // Only include the CSRF token for state-changing methods
  if (isStateChangingMethod && csrfToken) {
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    };
  }
  
  return fetch(url, options);
}

/**
 * React hook that returns a fetch function with CSRF token included
 */
export function useFetchWithCSRF() {
  const csrfToken = useCSRFToken();
  
  return (url: string, options: RequestInit = {}) => {
    const method = options.method || 'GET';
    const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
    
    // Only include the CSRF token for state-changing methods
    if (isStateChangingMethod && csrfToken) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken,
      };
    }
    
    return fetch(url, options);
  };
}