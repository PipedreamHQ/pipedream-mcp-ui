'use client';

import { createContext, useState, useEffect, ReactNode } from 'react';
import { SessionIdContext, useFetchWithCSRF } from '@/lib/fetch-with-csrf';
import { useAuth } from '@clerk/nextjs';

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { isLoaded, userId } = useAuth();
  const fetchWithCSRF = useFetchWithCSRF();

  useEffect(() => {
    async function getExternalUserId() {
      // Check if auth is loaded
      if (!isLoaded) return;
      
      // Clear session ID if user is not authenticated
      if (!userId) {
        console.log("User not authenticated, clearing session ID");
        setSessionId(null);
        
        // Also clear from sessionStorage to ensure consistency
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pdExternalUserId');
        }
        return;
      }

      // Instead of using the sessionStorage value directly, always fetch from the server
      // to ensure we're getting the Clerk value if it exists
      try {
        // This endpoint will prioritize the Clerk metadata value if it exists
        const response = await fetchWithCSRF('/mcp/api/external-user-id');
        
        if (response.ok) {
          const data = await response.json();
          if (data.externalUserId) {
            console.log(`Using external user ID from ${data.source}:`, data.externalUserId);
            const externalId = data.externalUserId;
            setSessionId(externalId);
            
            // Update sessionStorage with the most current value from Clerk
            if (typeof window !== 'undefined') {
              const currentStoredId = sessionStorage.getItem('pdExternalUserId');
              
              if (currentStoredId !== externalId) {
                console.log("Updating sessionStorage with current external user ID:", externalId);
                sessionStorage.setItem('pdExternalUserId', externalId);
              }
            }
            return;
          }
        } else {
          console.error("Error response from external-user-id API:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error getting external user ID from server:", error);
        
        // Fallback to sessionStorage if the API call fails
        const storedId = typeof window !== 'undefined' ? sessionStorage.getItem('pdExternalUserId') : null;
        
        if (storedId) {
          console.log("Falling back to stored UUID from session:", storedId);
          setSessionId(storedId);
        }
      }
    }
    
    // Run the function whenever auth state changes
    getExternalUserId();
  }, [isLoaded, userId, fetchWithCSRF]);

  return (
    <SessionIdContext.Provider value={sessionId}>
      {children}
    </SessionIdContext.Provider>
  );
}