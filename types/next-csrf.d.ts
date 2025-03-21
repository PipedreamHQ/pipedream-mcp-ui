declare module 'next-csrf' {
  import { NextRequest, NextResponse } from 'next/server';
  
  export interface CSRFOptions {
    secret: string;
    ignoredMethods?: string[];
    cookieOptions?: {
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
      path?: string;
      secure?: boolean;
    };
    headerKey?: string;
    bodyKey?: string;
    tokenKey?: string;
  }

  type NextRequestHandler = (req: NextRequest) => Promise<NextResponse>;
  
  interface CSRF {
    csrf: (handler: NextRequestHandler) => NextRequestHandler;
    setup: (handler: NextRequestHandler) => NextRequestHandler;
  }
  
  export function nextCsrf(options: CSRFOptions): CSRF;
}