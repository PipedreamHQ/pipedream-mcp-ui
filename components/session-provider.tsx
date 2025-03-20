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
      // Only proceed if user is authenticated
      if (!userId) {
        console.log("User not authenticated, not generating UUID");
        return;
      }

      // First check if we already have a UUID in sessionStorage for this page session
      const storedId = sessionStorage.getItem('pdExternalUserId');
      
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
    
    // Only get the external user ID when auth is loaded
    if (isLoaded) {
      getExternalUserId();
    }
  }, [isLoaded, userId, fetchWithCSRF]);

  return (
    <SessionIdContext.Provider value={sessionId}>
      {children}
    </SessionIdContext.Provider>
  );
}