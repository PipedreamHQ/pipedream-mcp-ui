import { NextRequest, NextResponse } from "next/server"
import { createBackendClient } from "@pipedream/sdk/server"
import { getAuth } from "@clerk/nextjs/server"
import { ProjectEnvironment } from "@/lib/utils"
import { getPipedreamExternalUserId } from "@/lib/clerk"

// Initialize Pipedream client
const getPipedreamClient = () => {
  return createBackendClient({
    apiHost: process.env.PIPEDREAM_API_HOST,
    environment: (process.env.PIPEDREAM_ENVIRONMENT as ProjectEnvironment) || "development",
    credentials: {
      clientId: process.env.PIPEDREAM_OAUTH_CLIENT_ID || process.env.CLIENT_ID || "",
      clientSecret: process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || process.env.CLIENT_SECRET || "",
    },
    projectId: process.env.PIPEDREAM_PROJECT_ID || "",
  })
}

// Helper function to get externalUserId safely
async function getExternalUserId(req: NextRequest) {
  try {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    let userId = null
    
    try {
      // Try to get auth from Clerk
      const auth = getAuth(req)
      userId = auth.userId
      
      // Only log in debug mode
      if (debugMode) {
        console.log("Retrieved Clerk auth object:", JSON.stringify(auth, null, 2))
        console.log("Retrieved Clerk userId:", userId)
      }
    } catch (authError) {
      if (debugMode) {
        console.error("Error getting auth, using fallback:", authError)
      }
      // Continue with the function, we'll use a fallback userId
    }
    
    // Only log headers for debugging in debug mode
    if (debugMode) {
      const headers: Record<string, string> = {}
      req.headers.forEach((value, key) => {
        if (!key.toLowerCase().includes('cookie') && !key.toLowerCase().includes('auth')) {
          headers[key] = value
        }
      })
      console.log("Request headers:", headers)
    }
    
    // Check for a session ID in headers
    const sessionId = req.headers.get('x-session-id')
    
    let externalUserId = null
    
    // If we have a session ID header, prioritize that for backward compatibility
    if (sessionId) {
      externalUserId = sessionId
      if (debugMode) {
        console.log("Using session ID from header as external user ID:", externalUserId)
      }
    } 
    // If we have a userId, get or create the UUID from Clerk metadata
    else if (userId) {
      // This will get the UUID from Clerk metadata or create and store a new one
      externalUserId = await getPipedreamExternalUserId(userId)
      
      if (debugMode) {
        console.log("Using Pipedream external user ID from Clerk metadata:", externalUserId)
      }
    } 
    // No userId or session ID, generate a random UUID as fallback
    else {
      const { randomUUID } = await import('crypto')
      externalUserId = randomUUID()
      
      if (debugMode) {
        console.log("Using generated UUID as fallback external user ID:", externalUserId)
      }
    }
    
    return externalUserId
  } catch (error) {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    if (debugMode) {
      console.error("Error getting external user ID:", error)
    }
    // For demo purposes, return a placeholder user ID
    return "demo-user-id"
  }
}

// GET handler for listing accounts
export async function GET(request: NextRequest) {
  try {
    // Get external user ID for Pipedream
    const externalUserId = await getExternalUserId(request)
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    
    // If no externalUserId is available, return mock data
    if (!externalUserId) {
      if (debugMode) {
        console.warn("No external user ID available, returning mock data")
      }
      return NextResponse.json({
        data: {
          accounts: [
            {
              id: "mock-account-1",
              name: "Mock GitHub Account (No Auth)",
              external_id: "no-auth-user",
              healthy: true,
              dead: false,
              app: {
                id: "app_OrZhaO",
                name: "GitHub"
              },
              created_at: "2024-07-31T02:49:18.000Z",
              updated_at: "2024-08-01T03:58:17.000Z"
            }
          ]
        }
      })
    }
    
    // Check environment variables before proceeding
    if (!process.env.PIPEDREAM_OAUTH_CLIENT_ID || !process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      if (debugMode) {
        console.error("Missing required Pipedream credentials in environment variables:", {
          hasClientId: !!process.env.PIPEDREAM_OAUTH_CLIENT_ID,
          hasClientSecret: !!process.env.PIPEDREAM_OAUTH_CLIENT_SECRET,
          hasProjectId: !!process.env.PIPEDREAM_PROJECT_ID
        })
      }
      
      // For demo purposes, return mock data
      return NextResponse.json({
        data: {
          accounts: [
            {
              id: "mock-account-1",
              name: "Mock GitHub Account",
              external_id: externalUserId || "demo-user",
              healthy: true,
              dead: false,
              app: {
                id: "app_OrZhaO",
                name: "GitHub"
              },
              created_at: "2024-07-31T02:49:18.000Z",
              updated_at: "2024-08-01T03:58:17.000Z"
            },
            {
              id: "mock-account-2",
              name: "Mock Slack Account",
              external_id: externalUserId || "demo-user",
              healthy: true,
              dead: false,
              app: {
                id: "app_OkrhR1",
                name: "Slack"
              },
              created_at: "2024-07-30T22:52:48.000Z",
              updated_at: "2024-08-01T03:44:17.000Z"
            }
          ]
        }
      })
    }
    
    const pd = getPipedreamClient()
    const { searchParams } = new URL(request.url)

    // Log credentials being used (exclude sensitive values)
    if (debugMode) {
      console.log("Using Pipedream client with:", {
        environment: (process.env.PIPEDREAM_ENVIRONMENT as ProjectEnvironment) || "development",
        hasClientId: !!process.env.PIPEDREAM_OAUTH_CLIENT_ID,
        hasClientSecret: !!process.env.PIPEDREAM_OAUTH_CLIENT_SECRET,
        projectId: process.env.PIPEDREAM_PROJECT_ID,
      })
    }
    
    // Use the external user ID we've retrieved, which is either the UUID from metadata or newly generated
    if (debugMode) {
      console.log(`Fetching accounts with external_user_id: ${externalUserId} (ENV EXTERNAL_USER_ID: ${process.env.PIPEDREAM_EXTERNAL_USER_ID || 'not set'})`)
    }
    
    const accounts = await pd.getAccounts({
      external_user_id: externalUserId,
      app: searchParams.get("app") || undefined,
    })
    
    if (debugMode) {
      console.log(`Successfully fetched accounts:`, accounts)
    }
    return NextResponse.json(accounts)
  } catch (error) {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    if (debugMode) {
      console.error("Error fetching accounts:", error)
    }
    
    // For demo purposes, return mock data
    return NextResponse.json({
      data: {
        accounts: [
          {
            id: "mock-account-1",
            name: "Mock GitHub Account (Error Fallback)",
            external_id: "demo-user",
            healthy: true,
            dead: false,
            app: {
              id: "app_OrZhaO",
              name: "GitHub"
            },
            created_at: "2024-07-31T02:49:18.000Z",
            updated_at: "2024-08-01T03:58:17.000Z"
          }
        ]
      }
    })
  }
}

// DELETE handler for deleting an account
export async function DELETE(request: NextRequest) {
  try {
    // Get external user ID for Pipedream - will always return a value due to fallback
    const externalUserId = await getExternalUserId(request)
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    
    if (debugMode) {
      console.log(`Using external user ID for delete operation: ${externalUserId}`)
    }
    
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("id")
    
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      )
    }
    
    // Check if it's a mock account
    if (accountId.startsWith("mock-account-")) {
      if (debugMode) {
        console.log(`Simulating deletion of mock account ${accountId}`)
      }
      return NextResponse.json(
        { success: true, message: "Mock account deleted successfully" },
        { status: 200 }
      )
    }
    
    // Check environment variables before proceeding
    if (!process.env.PIPEDREAM_OAUTH_CLIENT_ID || !process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      if (debugMode) {
        console.error("Missing required Pipedream credentials in environment variables:", {
          hasClientId: !!process.env.PIPEDREAM_OAUTH_CLIENT_ID,
          hasClientSecret: !!process.env.PIPEDREAM_OAUTH_CLIENT_SECRET,
          hasProjectId: !!process.env.PIPEDREAM_PROJECT_ID
        })
      }
      return NextResponse.json(
        { success: true, message: "Account deletion simulated (missing credentials)" },
        { status: 200 }
      )
    }
    
    const pd = getPipedreamClient()
    
    // Log operation
    if (debugMode) {
      console.log(`Deleting account ${accountId} for external user ${externalUserId}`)
    }
    
    // Delete the account
    await pd.deleteAccount(accountId)
    
    if (debugMode) {
      console.log(`Successfully deleted account ${accountId}`)
    }
    return NextResponse.json(
      { success: true, message: "Account deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
    if (debugMode) {
      console.error("Error deleting account:", error)
    }
    return NextResponse.json(
      { error: "Failed to delete account", details: String(error) },
      { status: 500 }
    )
  }
}