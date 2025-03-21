import { getAuth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextResponse, NextRequest } from "next/server"
import { randomUUID } from "crypto"

const PD_EXTERNAL_USER_ID_KEY = "pd_external_user_id"

/**
 * GET /api/user-metadata
 * 
 * Retrieves the user's private metadata from Clerk, including their Pipedream external user ID.
 * If the PD external user ID doesn't exist, it creates one and stores it.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the auth context from the request
    console.log("[user-metadata] Processing GET request")
    
    try {
      const { userId } = getAuth(request)
      console.log("[user-metadata] Got userId from auth:", userId)
      
      if (!userId) {
        console.log("[user-metadata] No userId from auth, returning 401")
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }

      // Get user data from Clerk using the direct clerkClient
      console.log("[user-metadata] Fetching user data from Clerk for userId:", userId)
      let user
      try {
        user = await clerkClient.users.getUser(userId)
        console.log("[user-metadata] User data fetched, privateMetadata:", JSON.stringify(user.privateMetadata || {}))
      } catch (clerkError) {
        console.error("[user-metadata] Error fetching user from Clerk:", clerkError)
        return NextResponse.json(
          { error: "Error fetching user from Clerk" },
          { status: 500 }
        )
      }
    
      // Check if we already have a Pipedream external user ID
      let pdExternalUserId = user.privateMetadata[PD_EXTERNAL_USER_ID_KEY] as string
      console.log("[user-metadata] Existing external user ID:", pdExternalUserId)
    
      // If we don't have an ID yet, create and store one
      if (!pdExternalUserId) {
        pdExternalUserId = randomUUID()
        console.log("[user-metadata] Generated new external user ID:", pdExternalUserId)
      
        // Store the UUID in the user's private metadata
        console.log("[user-metadata] Updating user metadata with new ID")
        try {
          // Create a metadata object with our new value
          const metadata = {
            privateMetadata: {
              [PD_EXTERNAL_USER_ID_KEY]: pdExternalUserId,
            },
          }
          console.log("[user-metadata] Metadata object to update:", JSON.stringify(metadata))
        
          await clerkClient.users.updateUserMetadata(userId, metadata)
          console.log("[user-metadata] Successfully updated user metadata")
        } catch (updateError) {
          console.error("[user-metadata] Error updating user metadata:", updateError)
          return NextResponse.json(
            { error: "Error updating user metadata in Clerk" },
            { status: 500 }
          )
        }
      }
    
      // Fetch the user again to make sure we have the updated metadata
      console.log("[user-metadata] Fetching updated user metadata")
      let updatedUser
      try {
        updatedUser = await clerkClient.users.getUser(userId)
        console.log("[user-metadata] Updated user metadata:", JSON.stringify(updatedUser.privateMetadata || {}))
        console.log("[user-metadata] Final metadata state:", updatedUser.privateMetadata)
      } catch (fetchError) {
        console.error("[user-metadata] Error fetching updated user:", fetchError)
        // Even if there's an error fetching the updated user, we can still return the existing ID
      }
    
      // Return the external user ID that we either found or created
      console.log("[user-metadata] Returning successful response with external ID:", pdExternalUserId)
      return NextResponse.json({
        success: true,
        pd_external_user_id: pdExternalUserId,
        allMetadata: updatedUser?.privateMetadata || user.privateMetadata
      })
    } catch (authError) {
      console.error("[user-metadata] Error getting auth context:", authError)
      return NextResponse.json(
        { error: "Error getting authentication context" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Error retrieving user metadata:", error)
    return NextResponse.json(
      { error: "Failed to retrieve user metadata" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user-metadata
 * 
 * Updates the Pipedream external user ID in the user's private metadata.
 * If none is provided, generates a new random UUID.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    console.log("[user-metadata] POST request, userId:", userId)
    
    if (!userId) {
      console.log("[user-metadata] No userId from auth in POST")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Use the direct clerkClient
    console.log("[user-metadata] Using clerkClient for POST")
    
    // Get data from request body
    const { pd_external_user_id } = await request.json()
    console.log("[user-metadata] Received external_user_id in POST:", pd_external_user_id)
    
    // Use provided ID or generate a new one
    const externalUserId = pd_external_user_id || randomUUID()
    console.log("[user-metadata] Using external_user_id:", externalUserId)
    
    // Create a metadata object for the update
    const metadata = {
      privateMetadata: {
        [PD_EXTERNAL_USER_ID_KEY]: externalUserId,
      },
    }
    console.log("[user-metadata] Metadata object for POST:", JSON.stringify(metadata))
    
    try {
      // Update the user's private metadata
      await clerkClient.users.updateUserMetadata(userId, metadata)
      console.log("[user-metadata] Successfully updated user metadata in POST")
      
      // Verify the update worked
      const updatedUser = await clerkClient.users.getUser(userId)
      console.log("[user-metadata] Updated metadata after POST:", JSON.stringify(updatedUser.privateMetadata || {}))
      
      return NextResponse.json({
        success: true,
        pd_external_user_id: externalUserId,
        allMetadata: updatedUser.privateMetadata
      })
    } catch (updateError) {
      console.error("[user-metadata] Error updating user metadata in POST:", updateError)
      throw updateError
    }
  
  } catch (error) {
    console.error("Error updating user metadata:", error)
    return NextResponse.json(
      { error: "Failed to update user metadata" },
      { status: 500 }
    )
  }
}