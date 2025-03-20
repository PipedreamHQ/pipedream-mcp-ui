// Fix for headers() function in Next.js App Router
// The headers() function returns Headers instead of Promise<ReadonlyHeaders>
import { ReactNode } from 'react';

declare module 'next/headers' {
  export function headers(): Headers;
}

declare module '@clerk/nextjs' {
  export function ClerkProvider(props: { children: ReactNode, publishableKey?: string, appearance?: any }): JSX.Element;
  export function ClerkLoaded(props: { children: ReactNode }): JSX.Element;
}