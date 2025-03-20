// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server'

// Generate a nonce for CSP
function generateNonce() {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
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
  
  // Step 1: Create our secure headers response
  const secureResponse = NextResponse.next();
  addSecurityHeaders(secureResponse, nonce);
  
  // Step 2: Get the clerk auth middleware
  const clerkMiddlewareHandler = clerkMiddleware();
  
  // Step 3: Apply custom event handlers - this is needed for auth to work correctly
  const clerkResponse = clerkMiddlewareHandler(request);
  
  // Step 4: If we get a response from Clerk, apply our security headers to it
  // This is a bit of a hack because of the typing issues, but it should work
  if (clerkResponse) {
    try {
      // Wait for the promise to resolve if it's a promise
      return Promise.resolve(clerkResponse).then(res => {
        // If it's a Response object, clone it and add our headers
        if (res instanceof Response) {
          const headers = new Headers(res.headers);
          
          // Add CSP and security headers
          headers.set('Content-Security-Policy', generateCSPString(nonce));
          headers.set('X-Content-Type-Options', 'nosniff');
          headers.set('X-Frame-Options', 'SAMEORIGIN');
          headers.set('X-XSS-Protection', '1; mode=block');
          headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          
          // Create a new response with our headers
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers
          });
        }
        
        // If it's not a Response, return it as is
        return res;
      });
    } catch (e) {
      // If anything goes wrong with modifying the clerk response,
      // fall back to our secure response
      return secureResponse;
    }
  }
  
  // Return the secure response by default
  return secureResponse;
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
    'script-src': ["'self'", "'strict-dynamic'", `'nonce-${nonce}'`, "https://*.clerk.accounts.dev", "*.clerk.app", "https://clerk.dev", "'unsafe-inline'"],
    
    // Style sources - allow inline styles needed by many frameworks
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