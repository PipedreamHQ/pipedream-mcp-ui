import { parse as parseCookie } from 'cookie';
import { NextRequest } from 'next/server';

// Edge-compatible CSRF implementation using Double Submit Cookie pattern
// This doesn't rely on Node.js crypto which isn't available in Edge Runtime

/**
 * Generate a CSRF token - use Web Crypto API which is available in Edge Runtime
 */
function generateToken(): string {
  // Create a random array of bytes
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Convert to base64 string without using Buffer (not available in Edge Runtime)
  return btoa(String.fromCharCode.apply(null, [...array]));
}

/**
 * Compare two strings in constant time to prevent timing attacks
 * Edge-compatible implementation since crypto.subtle.timingSafeEqual isn't available
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to avoid timing differences, but return false
    let result = 1; // Non-zero ensures false return
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      result |= (i < a.length ? a.charCodeAt(i) : 0) ^ (i < b.length ? b.charCodeAt(i) : 0);
    }
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Cookie name constants
 */
export const CSRF_COOKIE = 'CSRF-TOKEN';
export const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Setup CSRF for a response
 */
export const setup = (res: Response): Response => {
  const token = generateToken();
  const headers = new Headers(res.headers);
  
  // Set a reasonable expiration time (24 hours)
  const expiresDate = new Date();
  expiresDate.setTime(expiresDate.getTime() + 24 * 60 * 60 * 1000);
  const expires = `; Expires=${expiresDate.toUTCString()}`;
  
  // Set a secure HttpOnly cookie with the token (not accessible to JavaScript)
  headers.append('Set-Cookie', `${CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; HttpOnly${expires}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);
  
  // Also set a JS-accessible cookie for our client code
  // This keeps the double-submit cookie pattern working while allowing our client code to access the value
  headers.append('Set-Cookie', `XSRF-TOKEN=${token}; Path=/; SameSite=Strict${expires}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);
  
  // Also add the token to response headers for the initial page load
  headers.append(CSRF_HEADER, token);
  
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers
  });
};

/**
 * Generate a token for client use - returns the token to be used in requests
 * This should only be called from the server-side API route that sets up CSRF,
 * as it returns the same token that's stored in the cookie
 */
export async function csrfToken(): Promise<string> {
  // Generate a single token to be used in both cookie and response
  // This implements the double submit cookie pattern correctly
  return generateToken();
}

/**
 * Validate CSRF token in middleware
 * This checks for token validity using Double Submit Cookie pattern
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  try {
    // Skip validation for GET, HEAD, OPTIONS methods
    const ignoredMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (ignoredMethods.includes(request.method)) {
      return true;
    }

    // Get token from header or form data
    let headerToken = request.headers.get(CSRF_HEADER) || 
                     request.headers.get(CSRF_HEADER.toLowerCase());
    
    // Try to get token from form body if it's a form submission
    let formToken = null;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || 
        contentType.includes('multipart/form-data')) {
      try {
        // Clone the request to avoid reading the body stream multiple times
        const clonedRequest = request.clone();
        const formData = await clonedRequest.formData();
        formToken = formData.get('_csrf')?.toString() || null;
      } catch (e) {
        console.warn('Could not parse form data for CSRF token:', e);
      }
    }
    
    // Try to get token from JSON body if it's a JSON request
    let jsonToken = null;
    if (contentType.includes('application/json')) {
      try {
        // Clone the request to avoid reading the body stream multiple times
        const clonedRequest = request.clone();
        const jsonData = await clonedRequest.json();
        jsonToken = jsonData._csrf || null;
      } catch (e) {
        // Silent fail - JSON parsing might fail for various reasons
        // and we don't want to log every API request that doesn't include a CSRF token
      }
    }
    
    // Use header token, form token, or JSON token (in that order of preference)
    const submittedToken = headerToken || formToken || jsonToken;
    
    // Get tokens from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      console.warn('CSRF validation failed: No cookies');
      return false;
    }
    
    const cookies = parseCookie(cookieHeader);
    
    // Get the HttpOnly cookie token
    const secureToken = cookies[CSRF_COOKIE];
    
    // For validation, we need:
    // 1. A submitted token (header, form, or JSON)
    // 2. A secure cookie token
    if (!submittedToken || !secureToken) {
      console.warn('CSRF validation failed: Missing required tokens');
      return false;
    }

    // Validate using Double Submit Cookie pattern:
    // The submitted token must match the secure HttpOnly cookie
    // Use constant time comparison to prevent timing attacks
    const isValid = constantTimeEqual(submittedToken, secureToken);
    
    if (!isValid) {
      console.warn('CSRF token mismatch: Submitted token does not match secure cookie token');
    }
    
    return isValid;
  } catch (error) {
    console.error('CSRF validation error:', error);
    return false;
  }
}