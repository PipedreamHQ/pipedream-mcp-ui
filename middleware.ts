// middleware.ts
import { NextResponse } from 'next/server'
import { NextRequest, NextFetchEvent } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'
import { validateCSRFToken } from './lib/csrf';

// The basePath your Next.js app is using
const BASE_PATH = '/mcp';

/**
 * Determines if a request is likely related to Clerk authentication
 */
function isClerkRequest(request: NextRequest): boolean {
  // Check URL patterns that are likely Clerk-related
  if (request.nextUrl.pathname.includes('/__clerk') ||
      request.nextUrl.pathname.includes(`${BASE_PATH}/sign-in`) ||
      request.nextUrl.pathname.includes(`${BASE_PATH}/sign-up`) ||
      request.nextUrl.host?.includes('clerk.')) {
    return true;
  }
  
  // Check for Clerk-specific headers
  if (request.headers.has('clerk-frontend-api')) {
    return true;
  }
  
  return false;
}

// Create a custom middleware that applies security headers
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Check if we're in debug mode
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  
  // Check if it's a Clerk-related request
  const isAuthRequest = isClerkRequest(request);
  
  if (isAuthRequest && debugMode) {
    console.log(`Detected Clerk auth request: ${request.method} ${request.nextUrl.pathname}`);
  }
  
  // Test page check removed
  
  // Debug mode checks removed
  
  // CSRF Protection only for API endpoints and non-Clerk requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) && 
      !isAuthRequest &&  // Skip CSRF validation for Clerk auth requests
      request.nextUrl.pathname.startsWith(`${BASE_PATH}/api/`) && 
      !request.nextUrl.pathname.startsWith(`${BASE_PATH}/api/webhooks/`) && 
      !request.nextUrl.pathname.startsWith(`${BASE_PATH}/api/csrf`)) {
    
    try {
      if (debugMode) {
        console.log(`Validating CSRF for: ${request.method} ${request.nextUrl.pathname}`);
      }
      
      const csrfValid = await validateCSRFToken(request);
      if (!csrfValid) {
        if (debugMode) {
          console.error(`CSRF validation failed for ${request.method} ${request.nextUrl.pathname}`);
          
          // Extra debug info
          const cookieHeader = request.headers.get('cookie');
          console.error(`Cookie header exists: ${!!cookieHeader}`);
          if (cookieHeader) {
            console.error(`Cookie header length: ${cookieHeader.length}`);
          }
          
          const headerToken = request.headers.get('X-CSRF-Token');
          console.error(`CSRF header exists: ${!!headerToken}`);
        }
        
        return NextResponse.json(
          { 
            error: 'Invalid CSRF token', 
            message: `Please include a valid CSRF token in the X-CSRF-Token header or request body. Get a token from ${BASE_PATH}/api/csrf.`
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
  
  let clerkRequest = request;
  if (isAuthRequest) {
    // https://clerk.com/docs/deployments/deploy-behind-a-proxy
    // These get passed from the pipedreamcom-proxy to Vercel,
    // then from Vercel to Clerk here
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-forwarded-host', request.headers.get('x-forwarded-host') || '');
    requestHeaders.set('x-forwarded-proto', request.headers.get('x-forwarded-proto') || '');
    
    // Create a new request with the updated headers
    clerkRequest = new NextRequest(request.url, {
      ...request,
      headers: requestHeaders,
    });
  }

  // Apply Clerk middleware with the updated request
  const clerkResponse = await clerkMiddleware(clerkRequest, event);
  
  // Add security headers to the response
  if (clerkResponse instanceof Response) {
    const headers = new Headers(clerkResponse.headers);
    
    // Add security headers
    headers.set('Content-Security-Policy', generateCSPString());
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Create a new response with our headers
    return new Response(clerkResponse.body, {
      status: clerkResponse.status,
      statusText: clerkResponse.statusText,
      headers
    });
  }
  
  return clerkResponse;
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
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

// Helper function to generate CSP string
function generateCSPString(): string {
  // Apply Content Security Policy
  const cspHeader = {
    // Default fallback - most restrictive
    'default-src': ["'self'"],
    
    // Script sources - self, Clerk, Cloudflare Turnstile, and dynamic script loading
    'script-src': [
      "'self'", 
      "'unsafe-inline'",  // Allow inline scripts
      "'unsafe-eval'",    // Allow eval for frameworks that need it
      "https://*.clerk.accounts.dev", 
      "*.clerk.app", 
      "https://clerk.dev", 
      "https://clerk.pipedream.com", 
      "https://*.clerk.pipedream.com",
      "https://challenges.cloudflare.com"
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
      "wss://*.clerk.accounts.dev",
      "https://challenges.cloudflare.com",
      "https://clerk-telemetry.com"
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
      "https://*.clerk.pipedream.com",
      "https://challenges.cloudflare.com"
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
 
// Configuration for Next.js middleware - optimized for both our needs and Clerk
export const config = {
  matcher: [
    // Match all paths except static files and _next
    "/((?!_next/image|_next/static|favicon.ico).*)",
    "/(api|trpc)(.*)",
    "/",
    // Include basePath-specific routes - must be hardcoded strings
    "/mcp/:path*",
    "/mcp/api/:path*", 
    "/mcp/sign-in/:path*",
    "/mcp/sign-up/:path*"
  ],
};
