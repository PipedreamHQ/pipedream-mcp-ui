import { secureJsonResponse } from "@/lib/security"
import { getAppActionsBySlug } from "@/lib/services/apps"

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug

  try {
    const result = await getAppActionsBySlug(slug)
    return secureJsonResponse(result)
  } catch (error) {
    console.error("Error fetching app actions:", error)
    const statusCode = error.message?.includes("App not found") ? 404 : 500
    
    return secureJsonResponse(
      { 
        error: "Failed to fetch actions", 
        details: String(error) 
      },
      { status: statusCode }
    )
  }
}