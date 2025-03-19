"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClerkMetadataTest() {
  const { isLoaded, user } = useUser()
  const [metadataResult, setMetadataResult] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [resetResult, setResetResult] = useState<any>(null)
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    metadata: false,
    test: false,
    reset: false
  })
  const [error, setError] = useState<{ [key: string]: string | null }>({
    metadata: null,
    test: null,
    reset: null
  })

  // Get user metadata
  const fetchUserMetadata = async () => {
    try {
      setLoading(prev => ({ ...prev, metadata: true }))
      setError(prev => ({ ...prev, metadata: null }))
      
      const response = await fetch('/api/user-metadata')
      const data = await response.json()
      
      setMetadataResult(data)
    } catch (err) {
      console.error("Error fetching user metadata:", err)
      setError(prev => ({ ...prev, metadata: String(err) }))
    } finally {
      setLoading(prev => ({ ...prev, metadata: false }))
    }
  }

  // Run test endpoint
  const runTestEndpoint = async () => {
    try {
      setLoading(prev => ({ ...prev, test: true }))
      setError(prev => ({ ...prev, test: null }))
      
      const response = await fetch('/api/test-clerk-metadata')
      const data = await response.json()
      
      setTestResult(data)
    } catch (err) {
      console.error("Error running test endpoint:", err)
      setError(prev => ({ ...prev, test: String(err) }))
    } finally {
      setLoading(prev => ({ ...prev, test: false }))
    }
  }

  // Reset user ID
  const resetUserId = async () => {
    try {
      setLoading(prev => ({ ...prev, reset: true }))
      setError(prev => ({ ...prev, reset: null }))
      
      const response = await fetch('/api/reset-user-id', {
        method: 'POST'
      })
      const data = await response.json()
      
      setResetResult(data)
      
      // If reset was successful, clear session storage
      if (data.success && data.reset_session) {
        sessionStorage.removeItem('pdExternalUserId')
      }
      
      // Refresh the metadata after reset
      if (data.success) {
        await fetchUserMetadata()
      }
    } catch (err) {
      console.error("Error resetting user ID:", err)
      setError(prev => ({ ...prev, reset: String(err) }))
    } finally {
      setLoading(prev => ({ ...prev, reset: false }))
    }
  }

  // Fetch metadata on load if user is available
  useEffect(() => {
    if (isLoaded && user) {
      fetchUserMetadata()
    }
  }, [isLoaded, user])

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be signed in to test Clerk metadata functionality.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/sign-in">Sign In</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Clerk Metadata Test</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Current authenticated user details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">User ID:</span> {user.id}
              </div>
              <div>
                <span className="font-medium">Email:</span> {user.primaryEmailAddress?.emailAddress || 'None'}
              </div>
              <div>
                <span className="font-medium">Name:</span> {user.fullName || 'None'}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Metadata</CardTitle>
            <CardDescription>Clerk private metadata for this user</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.metadata ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : error.metadata ? (
              <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
                {error.metadata}
              </div>
            ) : metadataResult ? (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">External User ID:</span>
                  <div className="mt-1 p-2 bg-muted rounded-md font-mono text-xs break-all">
                    {metadataResult.pd_external_user_id || 'None'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">All Metadata:</span>
                  <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(metadataResult.allMetadata, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No metadata loaded yet
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={fetchUserMetadata} 
              disabled={loading.metadata}
              className="w-full"
            >
              {loading.metadata ? "Loading..." : "Refresh Metadata"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Test Endpoint Card */}
        <Card>
          <CardHeader>
            <CardTitle>Test Clerk Metadata API</CardTitle>
            <CardDescription>Run a test to verify Clerk metadata operations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.test ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : error.test ? (
              <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
                {error.test}
              </div>
            ) : testResult ? (
              <div className="space-y-2">
                <div className={`text-${testResult.success ? 'green' : 'red'}-500 font-medium`}>
                  {testResult.message}
                </div>
                <div>
                  <span className="font-medium">Debug Info:</span>
                  <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(testResult.debugInfo, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Click the button below to run the test
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={runTestEndpoint} 
              disabled={loading.test}
              className="w-full"
            >
              {loading.test ? "Running Test..." : "Run Test Endpoint"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Reset User ID Card */}
        <Card>
          <CardHeader>
            <CardTitle>Reset External User ID</CardTitle>
            <CardDescription>Generate a new random UUID for this user</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.reset ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : error.reset ? (
              <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
                {error.reset}
              </div>
            ) : resetResult ? (
              <div className="space-y-2">
                <div className={`text-${resetResult.success ? 'green' : 'red'}-500 font-medium`}>
                  {resetResult.message}
                </div>
                {resetResult.success && (
                  <>
                    <div>
                      <span className="font-medium">New External User ID:</span>
                      <div className="mt-1 p-2 bg-muted rounded-md font-mono text-xs break-all">
                        {resetResult.pd_external_user_id}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Previous Metadata:</span>
                      <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
                        {JSON.stringify(resetResult.previous_metadata, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="font-medium">Current Metadata:</span>
                      <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto max-h-40">
                        {JSON.stringify(resetResult.current_metadata, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Click the button below to reset your external user ID
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={resetUserId} 
              disabled={loading.reset}
              variant="destructive"
              className="w-full"
            >
              {loading.reset ? "Resetting..." : "Reset External User ID"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}