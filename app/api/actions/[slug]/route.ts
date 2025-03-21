import { NextRequest } from 'next/server'
import { secureJsonResponse } from "@/lib/security"
import { getAppActionsBySlug } from "@/lib/services/apps"

// Define a more specific type for the context parameter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const result = await getAppActionsBySlug(slug)
    return secureJsonResponse(result)
  } catch (error) {
    console.error("Error fetching app actions:", error)
    const statusCode = (error as any)?.message?.includes("App not found") ? 404 : 500
    
    return secureJsonResponse(
      { 
        error: "Failed to fetch actions", 
        details: String(error) 
      },
      { status: statusCode }
    )
  }
}