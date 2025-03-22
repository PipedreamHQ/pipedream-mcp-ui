import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

const PD_EXTERNAL_USER_ID_KEY = "pd_external_user_id";

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 });
    }
    
    // First check if the user already has an external ID in Clerk
    const user = await clerkClient.users.getUser(userId);
    let pdExternalUserId = user.privateMetadata[PD_EXTERNAL_USER_ID_KEY] as string;
    
    // If found in Clerk, return it
    if (pdExternalUserId) {
      return NextResponse.json({ 
        externalUserId: pdExternalUserId,
        source: "clerk_metadata" 
      });
    }
    
    // If no ID exists in Clerk, generate a new random UUID
    const newUUID = randomUUID();
    
    // Store the new UUID in Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        [PD_EXTERNAL_USER_ID_KEY]: newUUID,
      },
    });
    
    return NextResponse.json({ 
      externalUserId: newUUID,
      source: "generated"
    });
  } catch (error) {
    // Return an authentication error on failure
    return NextResponse.json({ 
      error: "Authentication error"
    }, { status: 401 });
  }
}