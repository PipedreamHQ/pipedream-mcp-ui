"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'

export default function RedirectHandler() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const pathname = usePathname()

  // Handle user sign-in and external user ID creation
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return

    // Function to check if user has an external ID and create one if not
    async function ensureExternalUserId() {
      try {
        // Check if we already have the flag indicating we've checked user metadata
        const hasCheckedMetadata = sessionStorage.getItem('pd_checked_user_metadata')
        
        // Skip if we've already checked this session
        if (hasCheckedMetadata === 'true') return
        
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          console.log("RedirectHandler: Checking for external user ID")
        }
        
        // Call our API to get the user metadata, which will create the external ID if needed
        const response = await fetch('/api/user-metadata')
        if (response.ok) {
          const data = await response.json()
          if (data.pd_external_user_id) {
            if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
              console.log("RedirectHandler: External user ID exists or was created:", data.pd_external_user_id)
            }
            
            // Store in sessionStorage for use in the current session
            sessionStorage.setItem('pdExternalUserId', data.pd_external_user_id)
          }
        } else {
          console.error("RedirectHandler: Failed to get or create external user ID")
        }
        
        // Set the flag to avoid checking again this session
        sessionStorage.setItem('pd_checked_user_metadata', 'true')
      } catch (error) {
        console.error("RedirectHandler: Error ensuring external user ID:", error)
      }
    }
    
    // Ensure the user has an external ID
    ensureExternalUserId()
  }, [isLoaded, isSignedIn, user])

  // Handle redirect logic
  useEffect(() => {
    // Only run after auth is loaded
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