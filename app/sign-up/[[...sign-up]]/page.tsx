"use client"

import { SignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { getBaseUrl } from "@/lib/clerk"

export default function Page() {
  const searchParams = useSearchParams()
  // Get the redirect URL from search params, default to home path
  let originalRedirectUrl = searchParams.get("redirect_url") || "/"
  
  // Get the base URL from our helper function
  const baseUrl = getBaseUrl()
    
  // Always redirect to the initialize-metadata page first, which will then redirect to the original destination
  let redirectUrl = baseUrl + "/mcp/api/initialize-metadata"
  
  // Debug the redirect URL
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log("Sign-up page: original redirect_url parameter =", originalRedirectUrl)
    console.log("Sign-up page: redirecting first to =", redirectUrl)
  }
  
  // Store the original redirect URL in session storage to use it after metadata initialization
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('pdRedirectUrl', originalRedirectUrl)
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log("Sign-up page: stored original redirect URL in session storage:", originalRedirectUrl)
    }
  }
  
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log("Sign-up page: final redirectUrl =", redirectUrl)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            card: "shadow-lg",
          },
        }}
        redirectUrl={redirectUrl}
        path="/mcp/sign-up"
      />
    </div>
  )
}
