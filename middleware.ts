// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
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
  
  return NextResponse.next();
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/test/:path*", "/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}