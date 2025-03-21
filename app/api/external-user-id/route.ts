import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuth } from "@clerk/nextjs/server";

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    
    // Verify the user is authenticated
    const { userId } = getAuth(request);
    if (!userId) {
      if (debugMode) {
        console.log("User not authenticated, access denied");
      }
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 });
    }
    
    // Check if a client-provided sessionId is available in headers
    const sessionIdHeader = request.headers.get('x-session-id');
    
    // If we have a session ID from the client and it's a valid UUID, use it to ensure consistency
    if (sessionIdHeader && UUID_REGEX.test(sessionIdHeader)) {
      if (debugMode) {
        console.log(`Using valid client-provided session ID from header: ${sessionIdHeader}`);
      }
      return NextResponse.json({ 
        externalUserId: sessionIdHeader,
        source: "header" 
      });
    }
    
    // If the header doesn't exist or isn't valid, generate a new random UUID
    const newUUID = randomUUID();
    
    if (debugMode) {
      console.log(`Generated new UUID: ${newUUID}`);
      if (sessionIdHeader) {
        console.log(`Ignoring invalid session ID from header: ${sessionIdHeader}`);
      }
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