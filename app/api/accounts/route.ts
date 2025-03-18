import { NextRequest, NextResponse } from "next/server"
import { createBackendClient } from "@pipedream/sdk/server"
import { auth } from "@clerk/nextjs"

// Initialize Pipedream client
const getPipedreamClient = () => {
  return createBackendClient({
    environment: "development", // Hardcode to development for now
    credentials: {
      clientId: process.env.oauth_client_id || "",
      clientSecret: process.env.oauth_client_secret || "",
    },
    projectId: process.env.project_id || "",
  })
}

// GET handler for listing accounts
export async function GET(request: NextRequest) {
  try {
    // Get current user ID from auth
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const pd = getPipedreamClient()
    const { searchParams } = new URL(request.url)
    const app = searchParams.get("app") || undefined
    
    // Use the userId as the external user ID
    const accounts = await pd.getAccounts({
      external_user_id: userId,
      app: app,
    })
    
    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json(
      { error: "Failed to fetch accounts", details: String(error) },
      { status: 500 }
    )
  }
}

// DELETE handler for deleting an account
export async function DELETE(request: NextRequest) {
  try {
    // Get current user ID from auth
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const pd = getPipedreamClient()
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("id")
    
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      )
    }
    
    // Delete the account
    await pd.deleteAccount(accountId)
    
    return NextResponse.json(
      { success: true, message: "Account deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "Failed to delete account", details: String(error) },
      { status: 500 }
    )
  }
}