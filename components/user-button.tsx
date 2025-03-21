"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth, useClerk, useUser } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserIcon } from "lucide-react"
import { useCSRFToken } from "@/components/csrf-provider"
import { CSRF_HEADER } from "@/lib/csrf"
import { getBaseUrl } from "@/lib/clerk"

export function UserButton() {
  const { isLoaded, userId } = useAuth()
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const csrfToken = useCSRFToken()
  
  // Get the base URL from our helper function
  const baseUrl = getBaseUrl()
    
  // Check if pathname already has the /mcp prefix to avoid doubling it
  const fixedPathname = pathname.startsWith('/mcp') ? pathname : '/mcp' + pathname
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(baseUrl + fixedPathname)}`
  
  // Debug the redirection URL
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log("UserButton: pathname =", pathname)
    console.log("UserButton: baseUrl =", baseUrl)
    console.log("UserButton: fixedPathname =", fixedPathname)
    console.log("UserButton: signInUrl =", signInUrl)
  }

  if (!isLoaded) {
    return null
  }

  if (userId) {
    const primaryEmail = user?.primaryEmailAddress?.emailAddress || 'User';
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="gap-2">
            <UserIcon className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-default">
            {primaryEmail}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // We're just executing signOut without await or any promise handling
                // This is the cleanest approach, letting Clerk handle everything
                // Use the same baseUrl + path pattern for consistency
                signOut({ redirectUrl: baseUrl + fixedPathname });
              }}
            >
              Sign out
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Link href={signInUrl}>
      <Button variant="outline" size="icon">
        <UserIcon className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    </Link>
  )
}

