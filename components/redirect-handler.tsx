"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

export default function RedirectHandler() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    // Only run after auth is loaded and we're on the homepage
    if (!isLoaded) return
    
    // Check if we have a stored redirect URL to navigate to
    const storedRedirectUrl = typeof window !== 'undefined' 
      ? window.sessionStorage.getItem('pdRedirectUrl') 
      : null
    
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log("RedirectHandler: Pathname =", pathname)
      console.log("RedirectHandler: isSignedIn =", isSignedIn)
      console.log("RedirectHandler: storedRedirectUrl =", storedRedirectUrl)
    }
    
    // If we're signed in and on the homepage, and have a stored redirect URL, navigate to it
    if (isSignedIn && pathname === '/' && storedRedirectUrl && storedRedirectUrl !== '/') {
      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        console.log("RedirectHandler: Redirecting to stored URL:", storedRedirectUrl)
      }
      
      // Clear the stored redirect URL
      window.sessionStorage.removeItem('pdRedirectUrl')
      
      // Redirect to the stored URL
      router.push(storedRedirectUrl)
    }
  }, [isLoaded, isSignedIn, pathname, router])

  // This is a utility component that doesn't render anything
  return null
}