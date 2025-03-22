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
    const { userId } = getAuth(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user data from Clerk using the direct clerkClient
    const user = await clerkClient.users.getUser(userId)
    
    // Check if we already have a Pipedream external user ID
    let pdExternalUserId = user.privateMetadata[PD_EXTERNAL_USER_ID_KEY] as string
    
    // If we don't have an ID yet, create and store one
    if (!pdExternalUserId) {
      pdExternalUserId = randomUUID()
      
      // Store the UUID in the user's private metadata
      try {
        // Create a metadata object with our new value
        const metadata = {
          privateMetadata: {
            [PD_EXTERNAL_USER_ID_KEY]: pdExternalUserId,
          },
        }
        
        await clerkClient.users.updateUserMetadata(userId, metadata)
      } catch (updateError) {
        throw updateError
      }
    }
    
    // Fetch the user again to make sure we have the updated metadata
    const updatedUser = await clerkClient.users.getUser(userId)
    
    return NextResponse.json({
      success: true,
      pd_external_user_id: pdExternalUserId,
      allMetadata: updatedUser.privateMetadata
    })
  } catch (error) {
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
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Get data from request body
    const { pd_external_user_id } = await request.json()
    
    // Use provided ID or generate a new one
    const externalUserId = pd_external_user_id || randomUUID()
    
    // Create a metadata object for the update
    const metadata = {
      privateMetadata: {
        [PD_EXTERNAL_USER_ID_KEY]: externalUserId,
      },
    }
    
    try {
      // Update the user's private metadata
      await clerkClient.users.updateUserMetadata(userId, metadata)
      
      // Verify the update worked
      const updatedUser = await clerkClient.users.getUser(userId)
      
      return NextResponse.json({
        success: true,
        pd_external_user_id: externalUserId,
        allMetadata: updatedUser.privateMetadata
      })
    } catch (updateError) {
      throw updateError
    }
  
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user metadata" },
      { status: 500 }
    )
  }
}