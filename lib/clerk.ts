import { clerkClient } from "@clerk/nextjs/server"
import { randomUUID } from "crypto"

// clerkClient is already initialized by the Clerk SDK, we don't need to create a new instance

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

/**
 * Gets or creates a random UUID for the user and stores it in their Clerk metadata.
 * This UUID is used as the external_user_id for Pipedream API calls.
 */
export async function getPipedreamExternalUserId(userId: string) {
  try {
    if (!userId) {
      console.error("No userId provided to getPipedreamExternalUserId")
      return null
    }
    
    // For now, we'll generate a random UUID but not try to store it in Clerk
    // This is a temporary solution until we fix the Clerk metadata issues
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    const newUUID = randomUUID()
    
    if (debugMode) {
      console.log(`Generated new UUID ${newUUID} for user ${userId}`)
    }
    
    return newUUID
  } catch (error) {
    console.error("Error getting or creating Pipedream external user ID:", error)
    // Fallback to using the Clerk userId in case of error
    return userId
  }
}

