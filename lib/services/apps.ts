'use server';

import { supabase } from "@/lib/supabase";
import { App, SupabaseApp } from "@/lib/supabase";
import { createBackendClient } from "@pipedream/sdk/server";
import { ProjectEnvironment } from "@/lib/utils";

/**
 * Fetch apps from Supabase with pagination and filtering
 */
export async function getApps({
  query = "",
  category = "",
  page = 1,
  pageSize = 30,
  useBackup = false
}: {
  query?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  useBackup?: boolean;
}) {
  // XXX we need to automate the Supabase ETL
  // Try Supabase first unless backup is explicitly requested
  if (!useBackup) {
    try {
      // Check if we can connect to Supabase and the correct table
      const { data: tableInfo, error: tableError } = await supabase.from("apps").select("count").limit(1);

      if (tableError) {
        throw new Error(`Supabase connection error: ${tableError.message}`);
      }

      // Check if the table has any records
      const { count, error: countError } = await supabase.from("apps").select("*", { count: "exact", head: true });

      if (countError) {
        throw new Error(`Supabase count error: ${countError.message}`);
      }

      // If the table is empty, fall back to Pipedream API
      if (!count || count === 0) {
        throw new Error("Supabase apps table is empty");
      }

      // Build the query
      let supabaseQuery = supabase.from("apps").select("*", { count: "exact" })
        .not('PD_BUILDER_ONLY', 'is', 'true');

      // Apply search filter if query exists
      if (query) {
        // Properly sanitize input and use parameterized queries
        const sanitizedQuery = query.replace(/[%_\\]/g, '\\$&');
        supabaseQuery = supabaseQuery.or(`APP_NAME.ilike.%${sanitizedQuery}%,APP_NAME_SLUG.ilike.%${sanitizedQuery}%,APP_DESCRIPTION.ilike.%${sanitizedQuery}%`);
      }

      // Apply category filter if category exists
      if (category) {
        // Validate category input - categories should only contain alphanumeric and spaces
        if (!/^[a-zA-Z0-9 ]+$/.test(category)) {
          throw new Error("Invalid category format");
        }
        supabaseQuery = supabaseQuery.eq("CATEGORY_NAME", category);
      }

      // Calculate pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Get the data with pagination
      const {
        data: apps,
        error,
        count: totalCount,
      } = await supabaseQuery
        .order("APP_FEATURED_WEIGHT", { ascending: false })
        .order("APP_NAME", { ascending: true })
        .range(from, to);

      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      // If no apps were returned, fall back to Pipedream API
      if (!apps || apps.length === 0) {
        throw new Error("No apps returned from Supabase");
      }

      // Map the Supabase data to our app structure
      const mappedApps =
        apps?.map((app: SupabaseApp) => ({
          id: app.APP_ID.toString(),
          name: app.APP_NAME,
          name_slug: app.APP_NAME_SLUG,
          app_hid: app.APP_HID,
          description: app.APP_DESCRIPTION,
          categories: app.CATEGORY_NAME ? [app.CATEGORY_NAME] : [],
          featured_weight: app.APP_FEATURED_WEIGHT,
          api_docs_url: app.APP_API_DOCS_URL,
          status: app.APP_STATUS,
        })) || [];

      return {
        data: mappedApps,
        page_info: {
          total_count: totalCount || 0,
          current_page: page,
          page_size: pageSize,
          has_more: totalCount ? from + (apps?.length || 0) < totalCount : false,
        },
        source: "supabase",
      };
    } catch (error: unknown) {
      // Fall through to Pipedream API
      console.error("Supabase fetch failed, falling back to Pipedream API:", error);
    }
  }

  // Fallback to Pipedream API
  try {
    // Check required environment variables
    if (!process.env.PIPEDREAM_OAUTH_CLIENT_ID || !process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || !process.env.PIPEDREAM_PROJECT_ID) {
      throw new Error("Missing required Pipedream credentials");
    }

    const pd = createBackendClient({
      environment: (process.env.PIPEDREAM_ENVIRONMENT as ProjectEnvironment) || "development",
      credentials: {
        clientId: process.env.PIPEDREAM_OAUTH_CLIENT_ID,
        clientSecret: process.env.PIPEDREAM_OAUTH_CLIENT_SECRET,
      },
      projectId: process.env.PIPEDREAM_PROJECT_ID,
    });

    const options: {
      q?: string;
      limit: number;
      [key: string]: unknown;
    } = {
      limit: pageSize
    };

    if (query) {
      options.q = query;
    }

    // Set a reasonable limit
    options.limit = pageSize;

    const resp = await pd.getApps(options);

    // Define the type of the API response data
    type PipedreamApp = {
      id: string;
      name: string;
      name_slug: string;
      description?: string;
      categories?: string[];
      [key: string]: unknown;
    };

    // Filter by category if specified
    let filteredApps = (resp.data || []) as PipedreamApp[];

    if (category && filteredApps.length > 0) {
      filteredApps = filteredApps.filter(
        (app) => app.categories && app.categories.some((cat: string) => cat.toLowerCase() === category.toLowerCase()),
      );
    }

    // Map Pipedream API data to our app structure
    const mappedApps = filteredApps.map((app): App => ({
      id: app.id,
      name: app.name,
      name_slug: app.name_slug,
      app_hid: app.id, // Use id as app_hid for Pipedream API
      description: app.description || "", 
      categories: app.categories || [],
      // No featured_weight for Pipedream API
    }));

    // Sort the apps by name for consistency
    const sortedApps = [...mappedApps].sort((a, b) => a.name.localeCompare(b.name));

    return {
      data: sortedApps,
      page_info: {
        total_count: sortedApps.length,
        current_page: 1,
        page_size: pageSize,
        has_more: false, // Simplified pagination for fallback
      },
      source: "pipedream",
    };
  } catch (error) {
    console.error("Both Supabase and Pipedream API failed:", error);
    throw new Error(`Failed to fetch apps from any source: ${String(error)}`);
  }
}

/**
 * Get available app categories
 */
export async function getCategories() {
  try {
    // Try to get categories from Supabase
    const { data: apps, error } = await supabase.from("apps").select("CATEGORY_NAME").not("CATEGORY_NAME", "is", null);

    if (error) {
      throw error;
    }

    // Extract unique categories
    const categories = [...new Set(apps.map((app) => app.CATEGORY_NAME))].filter(Boolean).sort();

    // If we have categories from Supabase, return them
    if (categories.length > 0) {
      return {
        categories,
        source: "supabase",
      };
    }

    // Fallback to Pipedream API if no categories found in Supabase
    const pd = createBackendClient({
      environment: (process.env.PIPEDREAM_ENVIRONMENT as ProjectEnvironment) || "development",
      credentials: {
        clientId: process.env.PIPEDREAM_OAUTH_CLIENT_ID || "",
        clientSecret: process.env.PIPEDREAM_OAUTH_CLIENT_SECRET || "",
      },
      projectId: process.env.PIPEDREAM_PROJECT_ID || "",
    });

    const resp = await pd.getApps({ limit: 100 });

    // Extract unique categories from Pipedream API response
    const pdCategories = [...new Set(resp.data.flatMap((app) => app.categories || []))].filter(Boolean).sort();

    return {
      categories: pdCategories,
      source: "pipedream",
    };
  } catch (error) {
    // If all else fails, return some default categories
    return {
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
    };
  }
}

/**
 * Get app actions by slug
 */
export async function getAppActionsBySlug(slug: string) {
  if (!slug) {
    throw new Error("App slug is required");
  }

  // Validate slug format (slugs should only contain alphanumeric, hyphens, and underscores)
  if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
    throw new Error("Invalid slug format");
  }

  try {
    // First, get the app ID from the slug
    const { data: appData, error: appError } = await supabase
      .from("apps")
      .select("APP_ID")
      .eq("APP_NAME_SLUG", slug)
      .single();

    if (appError || !appData) {
      throw new Error(`App not found: ${appError?.message || ""}`);
    }

    const appId = appData.APP_ID;

    // Now fetch components using the app_id
    // Try with APP_ID (uppercase, matching the apps table convention)
    let { data: actions, error } = await supabase.from("published_components").select("*").eq("APP_ID", appId);

    if (error) {
      // If that fails, try with app_id (lowercase)
      const { data: actionsLowercase, error: errorLowercase } = await supabase
        .from("published_components")
        .select("*")
        .eq("app_id", appId);

      if (errorLowercase) {
        throw new Error(`Failed to fetch actions: ${errorLowercase.message}`);
      }

      actions = actionsLowercase;
    }

    // Ensure we're returning a valid array
    const safeActions = Array.isArray(actions) ? actions : [];

    return {
      actions: safeActions,
      count: safeActions.length,
    };
  } catch (error) {
    throw new Error(`Error in actions API: ${error instanceof Error ? error.message : String(error)}`);
  }
}