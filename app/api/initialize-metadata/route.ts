import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { randomUUID } from "crypto"

/**
 * This API route initializes the external user ID in Clerk metadata and
 * then redirects to the original destination URL stored in session storage.
 * It's used as a redirect destination after sign-up to ensure metadata is created.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    
    if (!userId) {
      console.log("[initialize-metadata] No user ID found, redirecting to home")
      return NextResponse.redirect(new URL('/', request.url))
    }

    console.log(`[initialize-metadata] Processing metadata initialization for user: ${userId}`)
    
    // Get the user data
    const user = await clerkClient.users.getUser(userId)
    
    // Check if the user already has an external ID
    let pdExternalUserId = user.privateMetadata?.pd_external_user_id as string
    
    if (!pdExternalUserId) {
      // Generate a new UUID if one doesn't exist
      pdExternalUserId = randomUUID()
      console.log(`[initialize-metadata] Generated new external ID: ${pdExternalUserId}`)
      
      // Store it in Clerk's user metadata
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          pd_external_user_id: pdExternalUserId
        }
      })
      
      console.log(`[initialize-metadata] Stored external ID in Clerk metadata: ${pdExternalUserId}`)
    } else {
      console.log(`[initialize-metadata] User already has external ID: ${pdExternalUserId}`)
    }
    
    // Add a small delay to ensure Clerk has time to update the metadata
    // This is particularly important after a new user signs up
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to the original destination
    // If no custom destination is found in cookies, redirect to the home page
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('[initialize-metadata] Error initializing metadata:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}