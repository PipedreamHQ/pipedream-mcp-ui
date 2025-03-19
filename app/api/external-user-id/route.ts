import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    
    // Check if a client-provided sessionId is available in headers or cookies
    const sessionIdHeader = request.headers.get('x-session-id');
    
    // If we have a session ID from the client, use it to ensure consistency
    if (sessionIdHeader) {
      if (debugMode) {
        console.log(`Using client-provided session ID: ${sessionIdHeader}`);
      }
      return NextResponse.json({ externalUserId: sessionIdHeader });
    }
    
    // Generate a new random UUID
    const newUUID = randomUUID();
    
    if (debugMode) {
      console.log(`Generated new external user ID: ${newUUID}`);
    }
    
    return NextResponse.json({ externalUserId: newUUID });
  } catch (error) {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    if (debugMode) {
      console.error("Error generating external user ID:", error);
    }
    
    // Even if there's an error, generate a UUID to ensure the client has something to work with
    const fallbackId = randomUUID();
    return NextResponse.json({ 
      externalUserId: fallbackId,
      error: "Generated fallback ID due to error",
      details: debugMode ? String(error) : undefined
    });
  }
}