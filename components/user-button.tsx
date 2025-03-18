"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth, useClerk } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"

export function UserButton() {
  const { isLoaded, userId } = useAuth()
  const { signOut } = useClerk()
  const router = useRouter()
  const pathname = usePathname()
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(pathname)}`

  if (!isLoaded) {
    return null
  }

  if (userId) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={async () => {
          await signOut()
          // Redirect directly to the current page instead of going to sign-in
          router.push(pathname)
        }}
      >
        Sign out
      </Button>
    )
  }

  return (
    <Link href={signInUrl}>
      <Button variant="outline" size="sm">
        Sign in
      </Button>
    </Link>
  )
}

