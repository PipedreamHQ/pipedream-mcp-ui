import { getAuth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextResponse, NextRequest } from "next/server"
import { randomUUID } from "crypto"

/**
 * GET /api/test-clerk-metadata
 * 
 * Test endpoint that tries to set and get Clerk metadata.
 * Returns detailed debug information.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user ID
    const { userId } = getAuth(request)
    console.log("[test-clerk-metadata] GET request, userId:", userId)
    
    if (!userId) {
      console.log("[test-clerk-metadata] No userId from auth")
      return NextResponse.json(
        { error: "Unauthorized", message: "No userId available from auth()" },
        { status: 401 }
      )
    }
    
    // Collect debug information
    const debugInfo = {
      userId,
      initialMetadata: null,
      testValue: randomUUID(),
      updateResult: null,
      finalMetadata: null,
      error: null
    }
    
    try {
      // Step 1: Get current metadata
      console.log("[test-clerk-metadata] Fetching initial metadata")
      const user = await clerkClient.users.getUser(userId)
      debugInfo.initialMetadata = user.privateMetadata || {}
      console.log("[test-clerk-metadata] Initial metadata:", JSON.stringify(debugInfo.initialMetadata))
      
      // Step 2: Try to update metadata with a test value
      console.log("[test-clerk-metadata] Setting test value:", debugInfo.testValue)
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          test_value: debugInfo.testValue
        }
      })
      debugInfo.updateResult = "success"
      console.log("[test-clerk-metadata] Update successful")
      
      // Step 3: Get updated metadata to verify
      console.log("[test-clerk-metadata] Fetching updated metadata")
      const updatedUser = await clerkClient.users.getUser(userId)
      debugInfo.finalMetadata = updatedUser.privateMetadata || {}
      console.log("[test-clerk-metadata] Final metadata:", JSON.stringify(debugInfo.finalMetadata))
      
      // Check if update was successful
      const success = updatedUser.privateMetadata?.test_value === debugInfo.testValue
      
      return NextResponse.json({
        success,
        debugInfo,
        message: success 
          ? "Successfully set and retrieved Clerk metadata" 
          : "Failed to verify metadata update"
      })
    } catch (clerkError) {
      console.error("[test-clerk-metadata] Error during Clerk operations:", clerkError)
      debugInfo.error = String(clerkError)
      
      return NextResponse.json({
        success: false,
        debugInfo,
        message: "Error during Clerk metadata operations",
        error: String(clerkError)
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[test-clerk-metadata] Unexpected error:", error)
    
    return NextResponse.json({
      success: false,
      message: "Unexpected error during test",
      error: String(error)
    }, { status: 500 })
  }
}