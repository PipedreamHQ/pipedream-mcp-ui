import { NextResponse } from 'next/server';

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
export function secureJsonResponse(data: any, options: { status?: number } = {}): NextResponse {
  const response = NextResponse.json(data, options);
  return applySecurityHeaders(response);
}