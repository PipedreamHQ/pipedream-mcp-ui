import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuth } from "@clerk/nextjs/server";
import { getPipedreamExternalUserId } from "@/lib/clerk";

export async function GET(request: NextRequest) {
  try {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    
    // Check if a client-provided sessionId is available in headers
    const sessionIdHeader = request.headers.get('x-session-id');
    
    // If we have a session ID from the client, use it to ensure consistency
    if (sessionIdHeader) {
      if (debugMode) {
        console.log(`Using client-provided session ID from header: ${sessionIdHeader}`);
      }
      return NextResponse.json({ externalUserId: sessionIdHeader });
    }
    
    // Try to get the user ID from Clerk
    let userId = null;
    try {
      const auth = getAuth(request);
      userId = auth.userId;
      
      if (debugMode && userId) {
        console.log(`Found Clerk user ID: ${userId}`);
      }
    } catch (authError) {
      if (debugMode) {
        console.error("Error getting Clerk auth:", authError);
      }
      // We'll continue and use a fallback below
    }
    
    // If we have a user ID, try to get or create a UUID from Clerk metadata
    if (userId) {
      try {
        const externalUserId = await getPipedreamExternalUserId(userId);
        
        if (externalUserId) {
          if (debugMode) {
            console.log(`Retrieved external user ID from Clerk metadata: ${externalUserId}`);
          }
          
          return NextResponse.json({ 
            externalUserId,
            source: "clerk_metadata"
          });
        }
      } catch (clerkError) {
        if (debugMode) {
          console.error("Error retrieving from Clerk metadata:", clerkError);
        }
        // Continue to fallback
      }
    }
    
    // If we reach here, we don't have a valid ID from either headers or Clerk
    // Generate a new random UUID as fallback
    const newUUID = randomUUID();
    
    if (debugMode) {
      console.log(`Generated new fallback external user ID: ${newUUID}`);
    }
    
    return NextResponse.json({ 
      externalUserId: newUUID,
      source: "generated_fallback"
    });
  } catch (error) {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    if (debugMode) {
      console.error("Error in external-user-id endpoint:", error);
    }
    
    // Even if there's an error, generate a UUID to ensure the client has something to work with
    const fallbackId = randomUUID();
    return NextResponse.json({ 
      externalUserId: fallbackId,
      error: "Generated fallback ID due to error",
      source: "error_fallback",
      details: debugMode ? String(error) : undefined
    });
  }
}