'use client';

import { getNonce } from './csrf-provider';

/**
 * Helper function to add CSRF token to fetch requests
 * This should be used for all state-changing API calls (POST, PUT, DELETE)
 */
export async function fetchWithCSRF(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Ensure we have a CSRF token by fetching it if needed
  let csrfToken = getCSRFTokenFromCookie();
  
  if (!csrfToken) {
    // Fetch token if not available
    await fetchCSRFToken();
    csrfToken = getCSRFTokenFromCookie();
  }
  
  // Add CSRF token to headers for non-GET requests
  const method = options.method?.toUpperCase() || 'GET';
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    // Get nonce from meta tag
    const nonce = getNonce();
    
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': csrfToken || '',
      // Include nonce in request headers
      ...(nonce ? { 'x-nonce': nonce } : {}),
    };
  }
  
  return fetch(url, options);
}

/**
 * Get the CSRF token from the cookie
 */
function getCSRFTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Fetch a new CSRF token
 */
async function fetchCSRFToken(): Promise<void> {
  try {
    // Get nonce from meta tag
    const nonce = getNonce();
    const options: RequestInit = {};
    
    // Include nonce in request headers if available
    if (nonce) {
      options.headers = { 'x-nonce': nonce };
    }
    
    await fetch('/api/csrf', options);
    // The token will be set as a cookie by the server
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}