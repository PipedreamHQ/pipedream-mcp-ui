// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server'

// Generate a nonce for CSP
function generateNonce() {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

// Create a custom middleware that applies security headers
export function middleware(request: NextRequest, event: NextFetchEvent) {
  // Generate a nonce for this request
  const nonce = generateNonce();
  
  // Check if we're in debug mode
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  
  // Block access to /test page when not in debug mode
  if (!debugMode && request.nextUrl.pathname.startsWith('/test')) {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    addSecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }
  
  // Block access to API endpoints with debugging features when not in debug mode
  if (!debugMode && request.nextUrl.pathname.startsWith('/api/check-env') && 
      request.nextUrl.searchParams.has('includePipedreamTest')) {
    const redirectResponse = NextResponse.redirect(new URL('/api/check-env', request.url));
    addSecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }
  
  // Apply Clerk middleware
  const clerkHandler = clerkMiddleware();
  
  // Get the result of Clerk's middleware
  const clerkResponse = clerkHandler(request, event);
  
  // Create a wrapper for the response to add our CSP headers
  return Promise.resolve(clerkResponse).then(response => {
    if (response instanceof Response) {
      // Clone the response to modify headers
      const headers = new Headers(response.headers);
      
      // Add CSP and security headers
      headers.set('Content-Security-Policy', generateCSPString(nonce));
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
function addSecurityHeaders(response: NextResponse, nonce: string) {
  // Add CSP header to response
  response.headers.set('Content-Security-Policy', generateCSPString(nonce));
  
  // Add other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// Helper function to generate CSP string
function generateCSPString(nonce: string): string {
  // Apply Content Security Policy
  const cspHeader = {
    // Default fallback - deny all sources by default
    'default-src': ["'self'"],
    
    // Script sources - self and Clerk
    // XXX any way to avoid unsafe-inline?
    'script-src': ["'self'", "'strict-dynamic'", `'nonce-${nonce}'`, "https://*.clerk.accounts.dev", "*.clerk.app", "https://clerk.dev", "'unsafe-inline'"],
    
    // Style sources - allow inline styles needed by many frameworks
    // XXX any way to avoid unsafe-inline?
    'style-src': ["'self'", "'unsafe-inline'"],
    
    // Image sources
    'img-src': ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://pipedream.com", "https://*.clerk.accounts.dev", "https://*.clerk.app"],
    
    // Connect sources for API calls
    'connect-src': ["'self'", "https://mcp.pipedream.com", "https://*.clerk.accounts.dev", "https://*.clerk.app", "wss://*.clerk.accounts.dev"],
    
    // Font sources
    'font-src': ["'self'", "data:"],
    
    // Media sources
    'media-src': ["'self'"],
    
    // Frame sources
    'frame-src': ["'self'", "https://*.clerk.accounts.dev", "https://*.clerk.app"],
    
    // Manifest sources
    'manifest-src': ["'self'"],
    
    // Object sources
    'object-src': ["'none'"],
    
    // Base URI - restrict to origin
    'base-uri': ["'self'"],
    
    // Form action destinations
    'form-action': ["'self'", "https://*.clerk.accounts.dev", "https://*.clerk.app"],
    
    // Frame ancestors - prevent clickjacking
    'frame-ancestors': ["'self'"],
    
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