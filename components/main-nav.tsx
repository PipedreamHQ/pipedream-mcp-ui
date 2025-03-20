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
    <div className="mb-6 md:mb-10 mt-0 relative transition-all duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
        <div className="space-y-2 mb-4 md:mb-0 md:max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight transition-all duration-300">AI developer toolkit from Pipedream</h1>
          <p className="text-sm md:text-base text-muted-foreground transition-all duration-300">
            Access MCP servers for more than 2,500 APIs with 8,000 prebuilt tools using{` `}
            <Link 
              href="https://pipedream.com/connect"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-semibold transition-colors duration-200"
            >
              Pipedream Connect
            </Link>
          </p>
        </div>
        
        <div className="flex flex-row items-center mb-4 md:mb-0">
          <div className="flex items-center gap-2 ml-auto">
            <UserButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <nav className="flex w-full md:w-auto justify-center md:justify-end border rounded-lg p-1 bg-muted/30 overflow-hidden transition-all duration-300 md:ml-auto">
        <div className="flex flex-wrap w-full justify-center items-center gap-2">
          <Link 
            href="/" 
            className={cn(
              "px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-all duration-300 text-xs md:text-sm w-full md:w-40 text-center",
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
              "px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-all duration-300 text-xs md:text-sm w-full md:w-48 text-center",
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
                "px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-all duration-300 text-xs md:text-sm w-full md:w-auto text-center",
                isClerkTestPage
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-muted/80 text-foreground"
              )}
            >
              Clerk Test
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}