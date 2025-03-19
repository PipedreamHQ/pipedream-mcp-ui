"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth, useClerk } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserIcon } from "lucide-react"

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <UserIcon className="h-4 w-4" />
            Account
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push("/accounts")}>
            Connected accounts
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={async () => {
              await signOut()
              router.push(pathname)
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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

