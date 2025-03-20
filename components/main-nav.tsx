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
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 md:gap-4 mb-6 md:mb-10">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">AI developer toolkit from Pipedream</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Access MCP servers for more than 2,500 APIs with 8,000 prebuilt tools using{` `}
          <Link 
            href="https://pipedream.com/connect"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-semibold"
          >
            Pipedream Connect
          </Link>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        <nav className="flex flex-wrap items-center gap-2 border rounded-lg p-1 bg-muted/30 overflow-hidden transition-all duration-200">
          <Link 
            href="/" 
            className={cn(
              "px-3 py-1 md:px-4 md:py-2 rounded-md font-medium transition-colors text-xs md:text-sm w-32 text-center",
              isHomePage || isAppDetailPage
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-muted/80 text-foreground"
            )}
          >
            MCP Servers
          </Link>
          <Link 
            href="/accounts" 
            className={cn(
              "px-3 py-1 md:px-4 md:py-2 rounded-md font-medium transition-colors text-xs md:text-sm w-32 text-center",
              isAccountsPage
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-muted/80 text-foreground"
            )}
          >
            Connected Accounts
          </Link>
          
          {/* Only show Clerk Test link in debug mode */}
          {isDebugMode && (
            <Link 
              href="/test/clerk-metadata-test" 
              className={cn(
                "px-3 py-1 md:px-4 md:py-2 rounded-md font-medium transition-colors text-xs md:text-sm",
                isClerkTestPage
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-muted/80 text-foreground"
              )}
            >
              Clerk Test
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <UserButton />
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}