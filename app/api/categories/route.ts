import { secureJsonResponse } from "@/lib/security"
import { getCategories } from "@/lib/services/apps"

export async function GET() {
  try {
    const result = await getCategories()
    return secureJsonResponse(result)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return secureJsonResponse(
      { 
        error: "Failed to fetch categories", 
        details: String(error) 
      },
      { status: 500 }
    )
  }
}