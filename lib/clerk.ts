import { Clerk } from "@clerk/nextjs/server"

// This ensures Clerk is properly initialized with the correct configuration
export const clerkClient = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
})

// Helper function to get the origin for Clerk requests
export function getBaseUrl() {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // For server-side rendering, try to determine the origin
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback for local development
  return "http://localhost:3000"
}

