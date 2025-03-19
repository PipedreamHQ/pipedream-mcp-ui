import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

/**
 * A minimal test endpoint to verify Clerk metadata functionality
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user ID
    const auth = getAuth(request);
    console.log("Auth object:", auth);
    
    if (!auth.userId) {
      return NextResponse.json(
        { error: "Not authenticated", auth },
        { status: 401 }
      );
    }
    
    console.log("User ID:", auth.userId);
    
    // Get the user's metadata
    const user = await clerkClient.users.getUser(auth.userId);
    console.log("User object received");
    
    // Try to update the metadata with a test value
    const testValue = `test-${Date.now()}`;
    console.log("Setting test value:", testValue);
    
    await clerkClient.users.updateUserMetadata(auth.userId, {
      privateMetadata: {
        test_value: testValue
      }
    });
    console.log("Metadata updated successfully");
    
    // Verify the update worked
    const updatedUser = await clerkClient.users.getUser(auth.userId);
    console.log("Updated user fetched");
    
    return NextResponse.json({
      success: true,
      userId: auth.userId,
      initial_metadata: user.privateMetadata,
      updated_metadata: updatedUser.privateMetadata,
      test_value: testValue,
      test_matched: updatedUser.privateMetadata?.test_value === testValue
    });
  } catch (error) {
    console.error("Error in clerk-test:", error);
    return NextResponse.json(
      { 
        error: "Error testing Clerk functionality", 
        message: String(error),
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
}