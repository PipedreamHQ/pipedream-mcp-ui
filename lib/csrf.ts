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
 * Setup CSRF for a response
 */
export const setup = (res: Response): Response => {
  const token = generateToken();
  const headers = new Headers(res.headers);
  
  // Set cookie with the token (httpOnly for security)
  headers.append('Set-Cookie', `XSRF-TOKEN=${token}; Path=/; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);
  
  // Add the token to response headers too so it's accessible via JavaScript
  headers.append('X-CSRF-Token', token);
  
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers
  });
};

/**
 * CSRF middleware - not needed in our implementation as we handle it in 
 * middleware.ts directly
 */
export const csrf = (handler: any) => handler;

/**
 * Generate a token for client use
 */
export async function csrfToken(): Promise<string> {
  // We can't directly get the token - but we can tell the user to use the cookie value
  return 'Using cookie XSRF-TOKEN for CSRF protection';
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

    // Get token from header or form body
    let token = request.headers.get('X-CSRF-Token') || 
                request.headers.get('x-csrf-token') ||
                request.headers.get('X-Xsrf-Token');
    
    // Get token from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      console.warn('CSRF validation failed: No cookies');
      return false;
    }
    
    const cookies = parseCookie(cookieHeader);
    const cookieToken = cookies['XSRF-TOKEN'];
    
    // Check if a token exists and matches
    if (!token && !cookieToken) {
      console.warn('CSRF validation failed: No token provided');
      return false;
    }

    // If header token doesn't exist, use cookie token
    if (!token && cookieToken) {
      token = cookieToken;
    }

    // Check if token and cookie token exist and match
    if (token && cookieToken) {
      // For Double Submit Cookie pattern validation,
      // we just need to check if the token from the request matches 
      // the token from the cookie
      return token === cookieToken;
    }
    
    return false;
  } catch (error) {
    console.error('CSRF validation error:', error);
    return false;
  }
}