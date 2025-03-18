"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

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

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/accounts")
      if (!response.ok) {
        throw new Error("Failed to fetch accounts")
      }
      const data = await response.json()
      setAccounts(data.data?.accounts || [])
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast({
        title: "Error",
        description: "Failed to load connected accounts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async (accountId: string) => {
    setDeletingId(accountId)
    try {
      const response = await fetch(`/api/accounts?id=${accountId}`, {
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
      console.error("Error deleting account:", error)
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
    if (isLoaded && !userId) {
      // If user is not logged in, redirect to sign in
      router.push("/sign-in?redirect_url=/accounts")
      return
    }
    
    if (isLoaded && userId) {
      fetchAccounts()
    }
  }, [isLoaded, userId, router])
  
  if (!isLoaded || !userId) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-8">Connected Accounts</h1>
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
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Connected Accounts</h1>
      
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
                You haven't connected any accounts yet. Visit the apps page to connect your first account.
              </p>
              <Button onClick={() => router.push("/")}>
                Browse Apps
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
    </div>
  )
}