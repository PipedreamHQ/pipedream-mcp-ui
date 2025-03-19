"use client"

import { SignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"

export default function Page() {
  const searchParams = useSearchParams()
  let redirectUrl = searchParams.get("redirect_url") || "/"
  
  // Debug the redirect URL
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log("Sign-up page: original redirect_url parameter =", redirectUrl)
  }
  
  // Store the redirect URL in session storage to use it after sign-up
  // This is a workaround for Clerk's redirect limitations
  if (typeof window !== 'undefined') {
    if (redirectUrl !== '/') {
      window.sessionStorage.setItem('pdRedirectUrl', redirectUrl)
      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        console.log("Sign-up page: stored redirect URL in session storage:", redirectUrl)
      }
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
      />
    </div>
  )
}
