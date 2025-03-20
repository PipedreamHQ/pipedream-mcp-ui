import { NextRequest, NextResponse } from 'next/server';
import { csrf } from '@/lib/csrf';

// This route is protected by CSRF validation
async function handler(req: NextRequest) {
  return NextResponse.json({
    message: 'This is a protected API endpoint. Your CSRF token was valid!'
  });
}

// Wrap the handler with CSRF middleware
export const POST = csrf(handler);