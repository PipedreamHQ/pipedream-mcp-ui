"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserButton } from "@/components/user-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@clerk/nextjs"

export function MainNav() {
  const pathname = usePathname()
  const { isLoaded, userId } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDebugMode, setIsDebugMode] = useState(false)
  
  // Determine if we're on a specific page or section
  const isHomePage = pathname === '/'
  const isAccountsPage = pathname === '/accounts'
  const isAppDetailPage = pathname.startsWith('/app/')
  const isClerkTestPage = pathname === '/test/clerk-metadata-test'

  useEffect(() => {
    if (isLoaded) {
      setIsAuthenticated(!!userId)
    }
    
    // Check if debug mode is enabled
    setIsDebugMode(process.env.NEXT_PUBLIC_DEBUG_MODE === 'true')
  }, [isLoaded, userId])

  return (
    <div className="flex justify-between items-center mb-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">AI developer toolkit from Pipedream</h1>
        <p className="text-muted-foreground">
          Access MCP servers for more than 2,500 APIs with 8,000 prebuilt tools
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <nav className="flex items-center space-x-2">
          <Link 
            href="/" 
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-colors text-sm",
              isHomePage || isAppDetailPage
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
          >
            MCP Servers
          </Link>
          <Link 
            href="/accounts" 
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-colors text-sm",
              isAccountsPage
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
          >
            Connected Accounts
          </Link>
          
          {/* Only show Clerk Test link in debug mode */}
          {isDebugMode && (
            <Link 
              href="/test/clerk-metadata-test" 
              className={cn(
                "px-4 py-2 rounded-md font-medium transition-colors text-sm",
                isClerkTestPage
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              Clerk Test
            </Link>
          )}
        </nav>
        <UserButton />
        <ThemeToggle />
      </div>
    </div>
  )
}