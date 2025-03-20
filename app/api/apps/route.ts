import { secureJsonResponse } from "@/lib/security"
import { getApps } from "@/lib/services/apps"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const page = Number.parseInt(searchParams.get("page") || "1")
  const pageSize = 30
  const useBackup = searchParams.get("useBackup") === "true"

  try {
    const result = await getApps({
      query,
      category,
      page,
      pageSize,
      useBackup
    })

    return secureJsonResponse(result)
  } catch (error) {
    console.error("Error fetching apps:", error)
    return secureJsonResponse(
      {
        error: "Failed to fetch apps from any source",
        details: String(error),
      },
      { status: 500 }
    )
  }
}