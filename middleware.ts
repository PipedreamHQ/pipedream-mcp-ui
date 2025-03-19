// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server'
import { authMiddleware } from '@clerk/nextjs'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Apply Clerk middleware first
  const clerk = clerkMiddleware()(request);
  
  // Check if we're in debug mode
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  
  // Block access to /test page when not in debug mode
  if (!debugMode && request.nextUrl.pathname.startsWith('/test')) {
    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Block access to API endpoints with debugging features when not in debug mode
  if (!debugMode && request.nextUrl.pathname.startsWith('/api/check-env') && 
      request.nextUrl.searchParams.has('includePipedreamTest')) {
    // Return a simplified response without the test data
    return NextResponse.redirect(new URL('/api/check-env', request.url));
  }
  
  // Return the Clerk-processed response
  return clerk;
}
 
// Configuration for Next.js middleware
export const config = {
  // Run middleware on all paths
  matcher: [
    "/((?!_next/image|_next/static|favicon.ico).*)",
    "/",
    "/test/:path*", 
    "/api/:path*"
  ],
}