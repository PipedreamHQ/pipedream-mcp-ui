import { clerkClient } from "@clerk/clerk-sdk-node"
import { randomUUID } from "crypto"

// Helper function to get the origin for Clerk requests
export function getBaseUrl() {
  // Always use the environment variable if available
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
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
    
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    
    try {
      // First, try to get the external user ID from Clerk metadata
      console.log(`[clerk.ts] Fetching user data for userId: ${userId}`)
      const user = await clerkClient.users.getUser(userId)
      console.log(`[clerk.ts] User metadata for ${userId}:`, JSON.stringify(user.privateMetadata || {}))
      
      let pdExternalUserId = user.privateMetadata?.pd_external_user_id as string
      
      // If we found an ID in metadata, return it
      if (pdExternalUserId) {
        if (debugMode) {
          console.log(`Found existing UUID ${pdExternalUserId} for user ${userId} in Clerk metadata`)
        }
        return pdExternalUserId
      }
      
      // Otherwise, generate a new UUID and store it
      const newUUID = randomUUID()
      
      if (debugMode) {
        console.log(`Generated new UUID ${newUUID} for user ${userId}, storing in Clerk metadata`)
      }
      
      // Store the UUID in the user's private metadata
      console.log(`[clerk.ts] Updating metadata for userId: ${userId} with pd_external_user_id: ${newUUID}`)
      try {
        const metadata = {
          privateMetadata: {
            pd_external_user_id: newUUID,
          },
        }
        console.log(`[clerk.ts] Metadata object to update:`, JSON.stringify(metadata))
        
        // Use clerkClient
        await clerkClient.users.updateUserMetadata(userId, metadata)
        
        // Verify the update worked
        const updatedUser = await clerkClient.users.getUser(userId)
        console.log(`[clerk.ts] Updated metadata:`, JSON.stringify(updatedUser.privateMetadata || {}))
        
        console.log(`[clerk.ts] Successfully updated metadata for userId: ${userId}`)
      } catch (updateError) {
        console.error(`[clerk.ts] Error updating metadata for userId: ${userId}:`, updateError)
        throw updateError
      }
      
      return newUUID
    } catch (clerkError) {
      // If Clerk operations fail, fall back to just generating a UUID without storing it
      console.error("Error interacting with Clerk metadata:", clerkError)
      const fallbackUUID = randomUUID()
      
      if (debugMode) {
        console.log(`Clerk metadata operation failed, using fallback UUID ${fallbackUUID}`)
      }
      
      return fallbackUUID
    }
  } catch (error) {
    console.error("Error getting or creating Pipedream external user ID:", error)
    // Fallback to using the Clerk userId in case of error
    return userId
  }
}

