// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'
import { validateCSRFToken } from './lib/csrf';

// Create a custom middleware that applies security headers
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Check if we're in debug mode
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  
  // Block access to /test page when not in debug mode
  if (!debugMode && request.nextUrl.pathname.startsWith('/test')) {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    addSecurityHeaders(redirectResponse);
    return redirectResponse;
  }
  
  // Block access to API endpoints with debugging features when not in debug mode
  if (!debugMode && request.nextUrl.pathname.startsWith('/api/check-env') && 
      request.nextUrl.searchParams.has('includePipedreamTest')) {
    const redirectResponse = NextResponse.redirect(new URL('/api/check-env', request.url));
    addSecurityHeaders(redirectResponse);
    return redirectResponse;
  }
  
  // CSRF Protection for state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    // Skip CSRF validation for:
    // 1. Webhook endpoints
    // 2. CSRF setup endpoint itself
    if (!request.nextUrl.pathname.startsWith('/api/webhooks/') && 
        !request.nextUrl.pathname.startsWith('/api/csrf')) {
      try {
        const csrfValid = await validateCSRFToken(request);
        if (!csrfValid) {
          return NextResponse.json(
            { 
              error: 'Invalid CSRF token', 
              message: 'Please include a valid CSRF token in the X-CSRF-Token header or request body. Get a token from /api/csrf.'
            },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('CSRF validation error:', error);
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403 }
        );
      }
    }
  }
  
  // Apply Clerk middleware
  const clerkResponse = clerkMiddleware(request, event);
  
  // Add security headers to the response
  return Promise.resolve(clerkResponse).then(response => {
    if (response instanceof Response) {
      // Clone the response to modify headers
      const headers = new Headers(response.headers);
      
      // Add security headers
      headers.set('Content-Security-Policy', generateCSPString());
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'SAMEORIGIN');
      headers.set('X-XSS-Protection', '1; mode=block');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Create a new response with our headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
    return response;
  });
}

// Helper function to add security headers
function addSecurityHeaders(response: NextResponse) {
  // Add CSP header to response
  response.headers.set('Content-Security-Policy', generateCSPString());
  
  // Add other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// Helper function to generate CSP string
function generateCSPString(): string {
  // Apply Content Security Policy
  const cspHeader = {
    // Default fallback - most restrictive
    'default-src': ["'self'"],
    
    // Script sources - self, Clerk, and dynamic script loading
    'script-src': [
      "'self'", 
      "'unsafe-inline'",  // Allow inline scripts
      "'unsafe-eval'",    // Allow eval for frameworks that need it
      "https://*.clerk.accounts.dev", 
      "*.clerk.app", 
      "https://clerk.dev", 
      "https://clerk.pipedream.com", 
      "https://*.clerk.pipedream.com"
    ],
    
    // Style sources - allow inline styles needed by frameworks
    'style-src': ["'self'", "'unsafe-inline'"],
    
    // Image sources
    'img-src': [
      "'self'", 
      "data:", 
      "blob:", 
      "https://res.cloudinary.com", 
      "https://pipedream.com", 
      "https://*.clerk.accounts.dev", 
      "https://*.clerk.app", 
      "https://clerk.pipedream.com", 
      "https://*.clerk.pipedream.com",
      "https://img.clerk.com"
    ],
    
    // Connect sources for API calls
    'connect-src': [
      "'self'", 
      "https://mcp.pipedream.com", 
      "https://*.clerk.accounts.dev", 
      "https://*.clerk.app", 
      "https://clerk.pipedream.com", 
      "https://*.clerk.pipedream.com", 
      "wss://*.clerk.accounts.dev"
    ],
    
    // Font sources
    'font-src': ["'self'", "data:"],
    
    // Media sources
    'media-src': ["'self'"],
    
    // Frame sources
    'frame-src': [
      "'self'", 
      "https://*.clerk.accounts.dev", 
      "https://*.clerk.app", 
      "https://clerk.pipedream.com", 
      "https://*.clerk.pipedream.com"
    ],
    
    // Manifest sources
    'manifest-src': ["'self'"],
    
    // Object sources
    'object-src': ["'none'"],
    
    // Base URI - restrict to origin
    'base-uri': ["'self'"],
    
    // Form action destinations
    'form-action': [
      "'self'", 
      "https://*.clerk.accounts.dev", 
      "https://*.clerk.app", 
      "https://clerk.pipedream.com", 
      "https://*.clerk.pipedream.com"
    ],
    
    // Frame ancestors - prevent clickjacking
    'frame-ancestors': ["'self'"],
    
    // Worker sources
    'worker-src': ["'self'", "blob:"],
    
    // Upgrade insecure requests
    'upgrade-insecure-requests': [],
  };
  
  // Convert CSP object to string
  return Object.entries(cspHeader)
    .map(([key, values]) => {
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}
 
// Configuration for Next.js middleware
export const config = {
  // Run middleware on all paths
  matcher: [
    "/((?!_next/image|_next/static|favicon.ico).*)",
    "/",
    "/api/:path*"
  ],
}