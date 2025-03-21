import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// The key used to store the external user ID in Clerk's private metadata
const PD_EXTERNAL_USER_ID_KEY = "pd_external_user_id";

export async function GET(request: NextRequest) {
  try {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    
    // Verify the user is authenticated
    const { userId } = getAuth(request);
    if (!userId) {
      if (debugMode) {
        console.log("[external-user-id] User not authenticated, access denied");
      }
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 });
    }
    
    if (debugMode) {
      console.log(`[external-user-id] Processing request for user ${userId}`);
    }
    
    // FIRST PRIORITY: Check if there's an external ID already stored in Clerk metadata
    // This should always be the source of truth
    try {
      const user = await clerkClient.users.getUser(userId);
      const clerkExternalId = user.privateMetadata[PD_EXTERNAL_USER_ID_KEY] as string;
      
      if (clerkExternalId && UUID_REGEX.test(clerkExternalId)) {
        if (debugMode) {
          console.log(`[external-user-id] Using existing external ID from Clerk metadata: ${clerkExternalId}`);
        }
        
        return NextResponse.json({
          externalUserId: clerkExternalId,
          source: "clerk_metadata"
        });
      }
      
      if (debugMode && clerkExternalId) {
        console.log(`[external-user-id] Found invalid Clerk external ID: ${clerkExternalId}`);
      }
    } catch (clerkError) {
      console.error("[external-user-id] Error fetching user from Clerk:", clerkError);
      // Continue to fallbacks if Clerk metadata fetch fails
    }
    
    // SECOND PRIORITY: Check if a client-provided sessionId is available in headers
    const sessionIdHeader = request.headers.get('x-session-id');
    
    // If we have a session ID from the client and it's a valid UUID, use it to ensure consistency
    if (sessionIdHeader && UUID_REGEX.test(sessionIdHeader)) {
      if (debugMode) {
        console.log(`[external-user-id] Using valid client-provided session ID from header: ${sessionIdHeader}`);
      }
      
      // Store this ID in Clerk metadata for future use
      try {
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: {
            [PD_EXTERNAL_USER_ID_KEY]: sessionIdHeader,
          },
        });
        
        if (debugMode) {
          console.log(`[external-user-id] Stored header ID in Clerk metadata: ${sessionIdHeader}`);
        }
      } catch (updateError) {
        console.error("[external-user-id] Error updating Clerk metadata with header ID:", updateError);
      }
      
      return NextResponse.json({ 
        externalUserId: sessionIdHeader,
        source: "header" 
      });
    }
    
    // LAST OPTION: If the header doesn't exist or isn't valid, and no Clerk metadata exists,
    // generate a new random UUID and store it in Clerk for future use
    const newUUID = randomUUID();
    
    if (debugMode) {
      console.log(`[external-user-id] Generated new UUID: ${newUUID}`);
      if (sessionIdHeader) {
        console.log(`[external-user-id] Ignoring invalid session ID from header: ${sessionIdHeader}`);
      }
    }
    
    // Store this new ID in Clerk metadata for future use
    try {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          [PD_EXTERNAL_USER_ID_KEY]: newUUID,
        },
      });
      
      if (debugMode) {
        console.log(`[external-user-id] Stored new generated ID in Clerk metadata: ${newUUID}`);
      }
    } catch (updateError) {
      console.error("[external-user-id] Error updating Clerk metadata with new ID:", updateError);
    }
    
    return NextResponse.json({ 
      externalUserId: newUUID,
      source: "generated"
    });
  } catch (error) {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    if (debugMode) {
      console.error("Error in external-user-id endpoint:", error);
    }
    
    // Return an authentication error on failure
    return NextResponse.json({ 
      error: "Authentication error",
      details: debugMode ? String(error) : undefined
    }, { status: 401 });
  }
}