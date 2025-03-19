import { NextRequest, NextResponse } from "next/server"
import { createBackendClient } from "@pipedream/sdk/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePipedreamTest = searchParams.get("includePipedreamTest") === "true"
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    
    // Only return detailed environment status in debug mode
    if (debugMode) {
      // Check if all the required environment variables are set
      const envStatus = {
        clerk: {
          publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          secretKey: !!process.env.CLERK_SECRET_KEY,
        },
        supabase: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
        pipedream: {
          debug_mode: debugMode,
          environment: process.env.PIPEDREAM_ENVIRONMENT || "development",
          apiHost: !!process.env.PIPEDREAM_API_HOST,
          oauthClientId: !!process.env.PIPEDREAM_OAUTH_CLIENT_ID,
          clientId: !!process.env.CLIENT_ID,
          oauthClientSecret: !!process.env.PIPEDREAM_OAUTH_CLIENT_SECRET, 
          clientSecret: !!process.env.CLIENT_SECRET,
          projectId: !!process.env.PIPEDREAM_PROJECT_ID,
          externalUserId: !!process.env.PIPEDREAM_EXTERNAL_USER_ID,
        },
        nodeEnv: process.env.NODE_ENV,
      }
      
      // If requested, test Pipedream API connectivity
      if (includePipedreamTest) {
      const hasClientId = process.env.PIPEDREAM_OAUTH_CLIENT_ID || process.env.CLIENT_ID
      const hasClientSecret = process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || process.env.CLIENT_SECRET
      
      if (hasClientId && hasClientSecret && process.env.PIPEDREAM_PROJECT_ID) {
        try {
          if (debugMode) {
            console.log("Testing Pipedream API connectivity...")
          }
          
          const pd = createBackendClient({
            apiHost: process.env.PIPEDREAM_API_HOST,
            environment: process.env.PIPEDREAM_ENVIRONMENT || "development", // Keep this for the API
            credentials: {
              clientId: process.env.PIPEDREAM_OAUTH_CLIENT_ID || process.env.CLIENT_ID,
              clientSecret: process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || process.env.CLIENT_SECRET,
            },
            projectId: process.env.PIPEDREAM_PROJECT_ID,
          })
          
          // Just try to list apps as a simple API test
          const result = await pd.getApps({ limit: 1 })
          
          // Add the test result to the response
          return NextResponse.json({
            ...envStatus,
            pipedreamTest: {
              success: true,
              message: "Successfully connected to Pipedream API",
              appCount: result.data?.length || 0,
              actualExternalUserId: process.env.PIPEDREAM_EXTERNAL_USER_ID || "Using UUID stored in Clerk metadata"
            }
          })
        } catch (pipedreamError) {
          if (debugMode) {
            console.error("Pipedream API test failed:", pipedreamError)
          }
          return NextResponse.json({
            ...envStatus,
            pipedreamTest: {
              success: false,
              message: "Failed to connect to Pipedream API",
              error: String(pipedreamError)
            }
          })
        }
      } else {
        return NextResponse.json({
          ...envStatus,
          pipedreamTest: {
            success: false,
            message: "Missing Pipedream credentials",
            missingCredentials: {
              clientId: !(process.env.PIPEDREAM_OAUTH_CLIENT_ID || process.env.CLIENT_ID),
              clientSecret: !(process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || process.env.CLIENT_SECRET),
              apiHost: !process.env.PIPEDREAM_API_HOST,
              projectId: !process.env.PIPEDREAM_PROJECT_ID,
              externalUserId: !process.env.PIPEDREAM_EXTERNAL_USER_ID
            },
            actualExternalUserId: process.env.PIPEDREAM_EXTERNAL_USER_ID || "Using UUID stored in Clerk metadata"
          }
        })
      }
    }
    }

    // For non-debug environments, just return minimal status
    return NextResponse.json({
      debug_mode: debugMode
    })
  } catch (error) {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    if (debugMode) {
      console.error("Error checking environment:", error)
    }
    return NextResponse.json(
      { error: "Failed to check environment variables", details: String(error) },
      { status: 500 }
    )
  }
}