import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug

  if (!slug) {
    return NextResponse.json({ error: "App slug is required" }, { status: 400 })
  }

  try {
    console.log(`Fetching actions for app with slug: ${slug}`)

    // First, get the app ID from the slug
    const { data: appData, error: appError } = await supabase
      .from("apps")
      .select("APP_ID")
      .eq("APP_NAME_SLUG", slug)
      .single()

    if (appError || !appData) {
      console.error("Error fetching app ID:", appError)
      return NextResponse.json({ error: "App not found", details: appError?.message }, { status: 404 })
    }

    const appId = appData.APP_ID
    console.log(`Found app ID: ${appId} for slug: ${slug}`)

    // Now fetch components using the app_id
    // Try with APP_ID (uppercase, matching the apps table convention)
    let { data: actions, error } = await supabase.from("published_components").select("*").eq("APP_ID", appId)

    if (error) {
      console.error("Error with APP_ID, trying lowercase app_id:", error)

      // If that fails, try with app_id (lowercase)
      const { data: actionsLowercase, error: errorLowercase } = await supabase
        .from("published_components")
        .select("*")
        .eq("app_id", appId)

      if (errorLowercase) {
        console.error("Error with both APP_ID and app_id:", errorLowercase)

        // As a last resort, let's try to get a sample row to see the structure
        const { data: sampleData, error: sampleError } = await supabase
          .from("published_components")
          .select("*")
          .limit(1)

        if (!sampleError && sampleData && sampleData.length > 0) {
          console.log("Sample published_components columns:", Object.keys(sampleData[0]))
          console.log("Sample published_components data:", JSON.stringify(sampleData[0]))
        }

        return NextResponse.json({ error: "Failed to fetch actions", details: errorLowercase.message }, { status: 500 })
      }

      actions = actionsLowercase
    }

    console.log(`Found ${actions?.length || 0} actions for app ID ${appId}`)

    // Log the first action to see its structure
    if (actions && actions.length > 0) {
      console.log("First action structure:", Object.keys(actions[0]))
      console.log("First action data:", JSON.stringify(actions[0]))
    }

    // Ensure we're returning a valid array
    const safeActions = Array.isArray(actions) ? actions : []

    return NextResponse.json({
      actions: safeActions,
      count: safeActions.length,
    })
  } catch (error) {
    console.error("Error in actions API:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: "Failed to fetch actions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

