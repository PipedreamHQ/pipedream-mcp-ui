"use client"

import { useState, useEffect } from "react"
import { testSupabaseConnection } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function TestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [apiResult, setApiResult] = useState<any>(null)
  const [apiLoading, setApiLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const res = await testSupabaseConnection()
      setResult(res)
    } catch (error) {
      setResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const testApi = async (useBackup = false) => {
    setApiLoading(true)
    try {
      const url = useBackup ? "/api/apps?useBackup=true" : "/api/apps"
      const res = await fetch(url)
      const data = await res.json()
      setApiResult(data)
    } catch (error) {
      setApiResult({ error: String(error) })
    } finally {
      setApiLoading(false)
    }
  }

  useEffect(() => {
    // Auto-test on page load
    testConnection()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

      <div className="mb-8">
        <Button onClick={testConnection} disabled={loading}>
          {loading ? "Testing..." : "Test Direct Connection"}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h3 className="font-bold mb-2">{result.success ? "✅ Connection Successful" : "❌ Connection Failed"}</h3>
            {result.message && <p className="mb-2">{result.message}</p>}

            {result.sample && (
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Sample Record Structure:</h4>
                <div className="bg-background p-2 rounded text-xs">
                  <p>Columns: {Object.keys(result.sample).join(", ")}</p>
                  <p className="mt-1">APP_NAME: {result.sample.APP_NAME}</p>
                  <p>APP_NAME_SLUG: {result.sample.APP_NAME_SLUG}</p>
                  <p>CATEGORY_NAME: {result.sample.CATEGORY_NAME}</p>
                </div>
              </div>
            )}

            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">API Test</h2>

      <div className="flex gap-4">
        <Button onClick={() => testApi()} disabled={apiLoading}>
          {apiLoading ? "Testing..." : "Test API Endpoint"}
        </Button>

        <Button onClick={() => testApi(true)} disabled={apiLoading} variant="outline">
          {apiLoading ? "Testing..." : "Test with Pipedream Fallback"}
        </Button>
      </div>

      {apiResult && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <h3 className="font-bold mb-2">{apiResult.error ? "❌ API Error" : "✅ API Success"}</h3>
          <p className="mb-2">
            {apiResult.source ? `Data source: ${apiResult.source}` : ""}
            {apiResult.data ? ` | Found ${apiResult.data.length} apps` : ""}
          </p>
          <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(apiResult, null, 2)}</pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
        <div className="p-4 bg-muted rounded-md">
          <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Not set"}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not set"}</p>
        </div>
      </div>
    </div>
  )
}

