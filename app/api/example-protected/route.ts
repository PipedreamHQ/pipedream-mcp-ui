import { NextRequest, NextResponse } from 'next/server';
import { withCSRFProtection } from '@/lib/security';

// This route is protected by CSRF validation
// The middleware.ts file handles CSRF validation automatically for non-GET methods
// We're also using the withCSRFProtection HOC as defense in depth
async function handlePost(req: NextRequest) {
  return NextResponse.json({
    message: 'This is a protected API endpoint. Your CSRF token was valid!'
  });
}

// Apply CSRF protection to the route handler
export const POST = withCSRFProtection(handlePost);