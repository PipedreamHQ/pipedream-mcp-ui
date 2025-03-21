"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { getBaseUrl } from '@/lib/clerk'

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
        
        // Use the correct basePath-prefixed API URL
        // Get the base URL for proper request routing
        const baseUrl = window.location.origin
        
        // Call the external-user-id API first, which will properly check Clerk metadata
        // and ensure the Clerk value is used if it exists
        try {
          const response = await fetch('/mcp/api/external-user-id', {
            method: 'GET',
            credentials: 'include', // Include cookies for auth
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.externalUserId) {
              if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
                console.log(`RedirectHandler: External user ID from ${data.source}:`, data.externalUserId)
              }
              
              // Store in sessionStorage for use in the current session
              sessionStorage.setItem('pdExternalUserId', data.externalUserId)
              // Set the flag to avoid checking again this session
              sessionStorage.setItem('pd_checked_user_metadata', 'true')
              return // Successfully got the ID, so return early
            }
          } else {
            console.error("RedirectHandler: Failed to get external user ID. Status:", response.status)
          }
        } catch (fetchError) {
          console.error("RedirectHandler: Error fetching external user ID:", fetchError)
          // Continue to the fallback approach if this fails
        }
        
        // Fallback: Call the user-metadata API as a backup
        try {
          const response = await fetch('/mcp/api/user-metadata', {
            method: 'GET',
            credentials: 'include', // Include cookies for auth
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.pd_external_user_id) {
              if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
                console.log("RedirectHandler: External user ID from user-metadata API:", data.pd_external_user_id)
              }
              
              // Store in sessionStorage for use in the current session
              sessionStorage.setItem('pdExternalUserId', data.pd_external_user_id)
            }
          } else {
            console.error("RedirectHandler: Failed to get or create external user ID. Status:", response.status)
          }
        } catch (fetchError) {
          console.error("RedirectHandler: Error fetching user metadata:", fetchError)
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
    if (isSignedIn && (pathname === '/' || pathname === '/mcp/' || pathname === '/mcp') && storedRedirectUrl && storedRedirectUrl !== '/' && storedRedirectUrl !== '/mcp/' && storedRedirectUrl !== '/mcp') {
      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        console.log("RedirectHandler: Redirecting to stored URL:", storedRedirectUrl)
      }
      
      // Add the /mcp prefix if the path doesn't already have it and it's not an absolute URL
      let finalRedirectUrl = storedRedirectUrl;
      if (finalRedirectUrl && finalRedirectUrl.startsWith('/') && !finalRedirectUrl.startsWith('/mcp/') && !finalRedirectUrl.startsWith('http')) {
        finalRedirectUrl = '/mcp' + finalRedirectUrl;
        if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
          console.log("RedirectHandler: Added basePath to redirectUrl:", finalRedirectUrl)
        }
      }
      
      // Clear the stored redirect URL
      window.sessionStorage.removeItem('pdRedirectUrl')
      
      // Redirect to the stored URL
      router.push(finalRedirectUrl)
    }
  }, [isLoaded, isSignedIn, pathname, router])

  // This is a utility component that doesn't render anything
  return null
}