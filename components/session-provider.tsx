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

      // First check if we already have a UUID in sessionStorage for this page session
      const storedId = typeof window !== 'undefined' ? sessionStorage.getItem('pdExternalUserId') : null;
      
      if (storedId) {
        console.log("Using stored UUID from session:", storedId);
        setSessionId(storedId);
        return;
      }
      
      // If no stored ID, get a new UUID from the server
      try {
        const response = await fetchWithCSRF('/api/external-user-id');
        
        if (response.ok) {
          const data = await response.json();
          if (data.externalUserId) {
            console.log("Using server-generated UUID:", data.externalUserId);
            const newUuid = data.externalUserId;
            setSessionId(newUuid);
            // Store in session storage so it persists during navigation
            sessionStorage.setItem('pdExternalUserId', newUuid);
            return;
          }
        }
      } catch (error) {
        console.error("Error getting external user ID from server:", error);
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