"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { MainNav } from "@/components/main-nav"

interface Account {
  id: string
  name: string | null
  external_id: string
  healthy: boolean
  dead: boolean
  app: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      // Only log in debug mode
      if (debugMode) {
        // Log current user information from Clerk's client-side hooks
        console.log("Current user from Clerk client:", { 
          userId, 
          isLoaded,
          isSignedIn: userId !== null && isLoaded
        })
      }
      
      const response = await fetch("/mcp/api/accounts")
      if (!response.ok) {
        const errorText = await response.text()
        if (debugMode) {
          console.error("API Response error:", errorText)
        }
        throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Only log in debug mode
      if (debugMode) {
        console.log("Accounts API response (full):", JSON.stringify(data, null, 2))
      }
      
      // Handle either data structure:
      // data.data.accounts (from your example)
      // OR data.data (from Pipedream API response)
      if (data.data?.accounts) {
        if (debugMode) {
          console.log("Using data.data.accounts structure")
        }
        setAccounts(data.data.accounts)
      } else if (Array.isArray(data.data)) {
        if (debugMode) {
          console.log("Using data.data array structure")
        }
        setAccounts(data.data)
      } else {
        if (debugMode) {
          console.log("No accounts found in response, using empty array")
        }
        setAccounts([])
      }
    } catch (error) {
      if (debugMode) {
        console.error("Error fetching accounts:", error)
      }
      toast({
        title: "Error",
        description: "Failed to load connected accounts. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [userId, debugMode, isLoaded, setLoading, setAccounts])

  const deleteAccount = async (accountId: string) => {
    setDeletingId(accountId)
    try {
      // Import the enhanced fetch with CSRF protection
      const { fetchWithCSRF } = await import('@/lib/fetch-with-csrf')
      
      const response = await fetchWithCSRF(`/mcp/api/accounts?id=${accountId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete account")
      }
      
      toast({
        title: "Success",
        description: "Account disconnected successfully",
      })
      
      // Remove the deleted account from the list
      setAccounts(accounts.filter(account => account.id !== accountId))
    } catch (error) {
      if (debugMode) {
        console.error("Error deleting account:", error)
      }
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (isLoaded && userId) {
      // Only fetch accounts if user is authenticated
      fetchAccounts()
    }
  }, [isLoaded, userId, fetchAccounts])
  
  // Show loading state while clerk auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <main className="container mx-auto px-4 pt-8 pb-12">
          <MainNav />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // Helper function to test Pipedream API directly - only shown in debug mode
  const testPipedreamApi = async () => {
    try {
      if (debugMode) {
        // Then try the accounts endpoint directly
        console.log("Testing accounts endpoint directly...")
      }
      
      // Use existing fetch without CSRF since this is a GET request
      const accountsResponse = await fetch("/mcp/api/accounts")
      const accountsData = await accountsResponse.json()
      
      if (debugMode) {
        console.log("Direct accounts API response:", accountsData)
      }
      
      // Display count of accounts found
      const accountsCount = accountsData?.data?.accounts?.length || 
                           (Array.isArray(accountsData?.data) ? accountsData.data.length : 0);
      
      toast({
        title: "Pipedream API test",
        description: `Test completed. Found ${accountsCount} accounts. Check console for details.`,
        variant: "default"
      })
    } catch (error) {
      if (debugMode) {
        console.error("Error testing Pipedream API:", error)
      }
      toast({
        title: "Error", 
        description: "Failed to test Pipedream API. Check console for details.",
        variant: "destructive",
      })
    }
  }

  // Create the unauthenticated state content
  const unauthenticatedContent = (
    <Card className="mt-8">
      <CardContent className="pt-6">
        <div className="text-center py-10">
          <h3 className="text-lg font-medium mb-2">Sign in to manage connected accounts</h3>
          <p className="text-muted-foreground mb-4">
            You need to sign in to view and manage your connected accounts.
          </p>
          <Button onClick={() => router.push("/sign-in?redirect_url=/mcp/accounts")}>
            Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 pt-8 pb-12">
        <MainNav />
        
        {/* If not authenticated, show sign in prompt */}
        {!userId ? (
          unauthenticatedContent
        ) : (
          <>
            <div className="flex justify-between items-center mt-8 mb-6">
              <h2 className="text-2xl font-bold">Connected accounts</h2>
              <div className="flex gap-2">
                {debugMode && (
                  <Button variant="secondary" onClick={testPipedreamApi}>
                    Test API
                  </Button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-10">
                    <h3 className="text-lg font-medium mb-2">No connected accounts</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven&apos;t connected any accounts yet.
                    </p>
                    <Button onClick={() => router.push("/")}>
                      Browse MCP servers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader>
                      <CardTitle>{account.app.name}</CardTitle>
                      <CardDescription>
                        {account.name && `Account: ${account.name}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={account.healthy ? "default" : "destructive"}>
                          {account.healthy ? "Connected" : "Connection Issue"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Connected: {new Date(account.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full" disabled={deletingId === account.id}>
                            {deletingId === account.id ? "Disconnecting..." : "Disconnect"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect {account.app.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove your connection to {account.app.name} and any automated workflows that depend on this connection may stop working.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAccount(account.id)}>
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}