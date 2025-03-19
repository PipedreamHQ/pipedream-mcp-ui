"use client"

import { SignIn } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"

export default function Page() {
  const searchParams = useSearchParams()
  let originalRedirectUrl = searchParams.get("redirect_url") || "/"
  
  // Always redirect to the initialize-metadata page first, which will then redirect to the original destination
  let redirectUrl = "/api/initialize-metadata"
  
  // Debug the redirect URL
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log("Sign-in page: original redirect_url parameter =", originalRedirectUrl)
    console.log("Sign-in page: redirecting first to =", redirectUrl)
  }
  
  // Store the original redirect URL in session storage to use it after metadata initialization
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('pdRedirectUrl', originalRedirectUrl)
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log("Sign-in page: stored original redirect URL in session storage:", originalRedirectUrl)
    }
  }
  
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log("Sign-in page: final redirectUrl =", redirectUrl)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            card: "shadow-lg",
          },
        }}
        redirectUrl={redirectUrl}
      />
    </div>
  )
}

