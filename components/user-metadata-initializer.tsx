"use client"

import { useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useFetchWithCSRF } from '@/lib/fetch-with-csrf'

/**
 * This component initializes the external user ID in Clerk metadata
 * as soon as a user signs in or signs up. It runs at the top level
 * of the application to ensure IDs are created immediately.
 */
export default function UserMetadataInitializer() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const fetchWithCSRF = useFetchWithCSRF()

  useEffect(() => {
    // Only proceed if auth is loaded and user is signed in
    if (!isLoaded || !isSignedIn || !user) return

    // Create a flag in localStorage to track if we've initialized metadata for this user
    // This avoids unnecessary API calls on every page load
    const storageKey = `pd_initialized_metadata_${user.id}`
    const hasInitialized = localStorage.getItem(storageKey)

    // If we've already initialized metadata for this user in this browser, skip
    if (hasInitialized === 'true') return
    
    async function initializeUserMetadata() {
      console.log('UserMetadataInitializer: Initializing external user ID')
      
      try {
        // Make an API call to retrieve or create the external user ID
        const response = await fetchWithCSRF('/api/user-metadata')
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.pd_external_user_id) {
            console.log('UserMetadataInitializer: External user ID created/retrieved:', data.pd_external_user_id)
            
            // Store in sessionStorage for use in the current session
            sessionStorage.setItem('pdExternalUserId', data.pd_external_user_id)
            
            // Mark as initialized in localStorage to avoid redundant calls
            localStorage.setItem(storageKey, 'true')
          } else {
            console.error('UserMetadataInitializer: No external user ID in response')
          }
        } else {
          console.error('UserMetadataInitializer: Failed to get or create external user ID')
        }
      } catch (error) {
        console.error('UserMetadataInitializer: Error initializing external user ID:', error)
      }
    }

    // Initialize metadata as soon as the user logs in
    initializeUserMetadata()
    
    // Optional: Cleanup
    return () => {
      // Any cleanup if needed
    }
  }, [isLoaded, isSignedIn, user, fetchWithCSRF])

  // This component doesn't render anything visible
  return null
}