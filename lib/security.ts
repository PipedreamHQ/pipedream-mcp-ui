import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFToken } from './csrf';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Apply standard security headers to an API response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add HSTS header for production only
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

/**
 * Create a secure JSON response with appropriate security headers
 */
export function secureJsonResponse<T extends Record<string, unknown>>(data: T, options: { status?: number } = {}): NextResponse {
  const response = NextResponse.json(data, options);
  return applySecurityHeaders(response);
}

/**
 * Higher-order function for protecting API routes with CSRF validation
 * Use this to consistently apply CSRF protection to route handlers
 */
export function withCSRFProtection<T, Args extends unknown[]>(handler: (req: NextRequest, ...args: Args) => Promise<T>) {
  return async function(req: NextRequest, ...args: Args) {
    // Route-level CSRF validation as defense in depth
    // Even though middleware also does this check, applying it here ensures
    // protection even if middleware is bypassed
    const csrfValid = await validateCSRFToken(req);
    if (!csrfValid) {
      return NextResponse.json(
        { 
          error: 'Invalid CSRF token', 
          message: 'Please include a valid CSRF token in the X-CSRF-Token header or request body.'
        },
        { status: 403 }
      );
    }
    
    // If CSRF is valid, proceed to the actual route handler
    return handler(req, ...args);
  };
}

/**
 * Helper function to sanitize user inputs to prevent XSS
 * Uses DOMPurify for robust XSS protection
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Use DOMPurify for comprehensive sanitization
  // This handles complex XSS attack vectors
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }); // Strip all HTML
}