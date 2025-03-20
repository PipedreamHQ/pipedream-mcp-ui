import { NextRequest, NextResponse } from 'next/server';
import { setup } from '@/lib/csrf';

// Generate a CSRF token
export async function GET(req: NextRequest) {
  const response = NextResponse.json({ 
    message: "CSRF protection enabled", 
    note: "The XSRF-TOKEN cookie has been set. Use this value in your X-CSRF-Token header." 
  });
  
  // Apply our CSRF setup to the response
  return setup(response);
}