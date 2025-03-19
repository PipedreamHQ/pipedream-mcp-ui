import { getAuth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextResponse, NextRequest } from "next/server"
import { randomUUID } from "crypto"

const PD_EXTERNAL_USER_ID_KEY = "pd_external_user_id"

/**
 * POST /api/reset-user-id
 * 
 * Generates a new random UUID and updates the user's Clerk metadata.
 * Useful for testing or for users who want to change their identifier.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    console.log("[reset-user-id] POST request, userId:", userId)
    
    if (!userId) {
      console.log("[reset-user-id] No userId from auth")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get current metadata using the clerkClient
    console.log("[reset-user-id] Using clerkClient")
    const user = await clerkClient.users.getUser(userId)
    console.log("[reset-user-id] Current metadata:", JSON.stringify(user.privateMetadata || {}))
    
    // Generate a new UUID
    const newUUID = randomUUID()
    console.log("[reset-user-id] Generated new UUID:", newUUID)
    
    // Create metadata object for update
    const metadata = {
      privateMetadata: {
        [PD_EXTERNAL_USER_ID_KEY]: newUUID,
      },
    }
    console.log("[reset-user-id] Metadata object for update:", JSON.stringify(metadata))
    
    try {
      // Store the new UUID in the user's private metadata
      await clerkClient.users.updateUserMetadata(userId, metadata)
      console.log("[reset-user-id] Successfully updated user metadata")
      
      // Verify the update worked
      const updatedUser = await clerkClient.users.getUser(userId)
      console.log("[reset-user-id] Updated metadata:", JSON.stringify(updatedUser.privateMetadata || {}))
      
      // Clear sessionStorage on the client side by setting the expiresAt to now
      return NextResponse.json({
        success: true,
        message: "Successfully reset external user ID",
        pd_external_user_id: newUUID,
        previous_metadata: user.privateMetadata || {},
        current_metadata: updatedUser.privateMetadata || {},
        reset_session: true
      })
    } catch (updateError) {
      console.error("[reset-user-id] Error updating user metadata:", updateError)
      
      return NextResponse.json({
        success: false,
        message: "Error updating user metadata",
        error: String(updateError)
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error resetting user ID:", error)
    return NextResponse.json(
      { error: "Failed to reset user ID", details: String(error) },
      { status: 500 }
    )
  }
}