'use client';

import { useCSRFToken, getCSRFTokenFromMeta } from '@/components/csrf-provider';
import { createContext, useContext } from 'react';
import { CSRF_HEADER } from '@/lib/csrf';

// Session ID context
export const SessionIdContext = createContext<string | null>(null);

export const useSessionId = () => useContext(SessionIdContext);

/**
 * Enhanced fetch function that adds CSRF token and handles JSON bodies correctly
 */
function addCSRFToRequest(
  url: string,
  options: RequestInit = {},
  csrfToken: string
): RequestInit {
  const method = options.method || 'GET';
  const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
  
  // Only include the CSRF token for state-changing methods
  if (!isStateChangingMethod || !csrfToken) {
    return options;
  }

  // Create a new headers object to avoid mutating the original options
  const headers = new Headers(options.headers);
  headers.set(CSRF_HEADER, csrfToken);
  
  // Create a new options object
  const newOptions = { ...options, headers };
  
  // If this is a JSON request, include token in body too
  const contentType = headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      let body = {};
      
      // Parse the existing body if it exists
      if (options.body) {
        if (typeof options.body === 'string') {
          try {
            body = JSON.parse(options.body);
          } catch (parseError) {
            console.warn('Could not parse request body as JSON:', parseError);
            // Return with just headers since we couldn't parse the body
            return newOptions;
          }
        } else if (options.body instanceof FormData) {
          // Can't mix FormData with JSON, so return with just headers
          return newOptions;
        }
      }
      
      // Add the CSRF token to the body
      const newBody = {
        ...body,
        _csrf: csrfToken
      };
      
      // Update the body
      newOptions.body = JSON.stringify(newBody);
    } catch (e) {
      // If we can't parse the body, just continue with the header-only approach
      console.warn('Could not add CSRF token to request body:', e);
    }
  }
  
  return newOptions;
}

/**
 * Wrapper around fetch that automatically includes the CSRF token
 * from meta tag for state-changing methods (POST, PUT, DELETE, PATCH)
 */
export async function fetchWithCSRF(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCSRFTokenFromMeta();
  const enhancedOptions = addCSRFToRequest(url, options, csrfToken);
  return fetch(url, enhancedOptions);
}

/**
 * React hook that returns a fetch function with CSRF token included
 */
export function useFetchWithCSRF() {
  const csrfToken = useCSRFToken();
  
  return (url: string, options: RequestInit = {}) => {
    const token = csrfToken || getCSRFTokenFromMeta();
    const enhancedOptions = addCSRFToRequest(url, options, token);
    return fetch(url, enhancedOptions);
  };
}

/**
 * Hook that provides a fetch function with session ID header for API calls
 */
export function useFetchWithSessionId() {
  const sessionId = useSessionId();
  
  return (url: string, options: RequestInit = {}) => {
    // Only add the header for our API calls
    if (typeof url === 'string' && (url.startsWith('/api/') || url.startsWith('/mcp/api/')) && sessionId) {
      const headers = new Headers(options.headers);
      headers.set('x-session-id', sessionId);
      options = { ...options, headers };
    }
    
    return fetch(url, options);
  };
}

/**
 * Hook that provides a fetch function with both CSRF token and session ID
 */
export function useEnhancedFetch() {
  const csrfToken = useCSRFToken();
  const sessionId = useSessionId();
  
  return (url: string, options: RequestInit = {}) => {
    const isApiCall = typeof url === 'string' && (url.startsWith('/api/') || url.startsWith('/mcp/api/'));
    let enhancedOptions = { ...options };
    
    // Add CSRF token for state-changing methods
    const token = csrfToken || getCSRFTokenFromMeta();
    enhancedOptions = addCSRFToRequest(url, enhancedOptions, token);
    
    // Add session ID for API calls
    if (isApiCall && sessionId) {
      const headers = new Headers(enhancedOptions.headers);
      headers.set('x-session-id', sessionId);
      enhancedOptions.headers = headers;
    }
    
    return fetch(url, enhancedOptions);
  };
}