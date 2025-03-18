import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createBackendClient } from "@pipedream/sdk/server"

export async function GET() {
  try {
    // Try to get categories from Supabase
    const { data: apps, error } = await supabase.from("apps").select("CATEGORY_NAME").not("CATEGORY_NAME", "is", null)

    if (error) {
      console.error("Error fetching categories from Supabase:", error)
      throw error
    }

    // Extract unique categories
    const categories = [...new Set(apps.map((app) => app.CATEGORY_NAME))].filter(Boolean).sort()

    // If we have categories from Supabase, return them
    if (categories.length > 0) {
      return NextResponse.json({
        categories,
        source: "supabase",
      })
    }

    // Fallback to Pipedream API if no categories found in Supabase
    console.log("No categories found in Supabase, falling back to Pipedream API")

    const pd = createBackendClient({
      environment: process.env.environment || "development",
      credentials: {
        clientId: process.env.oauth_client_id || "",
        clientSecret: process.env.oauth_client_secret || "",
      },
      projectId: process.env.project_id || "",
    })

    const resp = await pd.getApps({ limit: 100 })

    // Extract unique categories from Pipedream API response
    const pdCategories = [...new Set(resp.data.flatMap((app) => app.categories || []))].filter(Boolean).sort()

    return NextResponse.json({
      categories: pdCategories,
      source: "pipedream",
    })
  } catch (error) {
    console.error("Error fetching categories:", error)

    // If all else fails, return some default categories
    return NextResponse.json({
      categories: [
        "Communication",
        "Marketing",
        "Productivity",
        "Social Media",
        "Developer Tools",
        "Analytics",
        "CRM",
        "E-commerce",
      ],
      source: "default",
    })
  }
}

