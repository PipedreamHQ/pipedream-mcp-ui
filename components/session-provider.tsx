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
        setSessionId(null);
        
        // Also clear from sessionStorage to ensure consistency
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pdExternalUserId');
        }
        return;
      }

      // Always fetch from server to ensure we have the latest ID from Clerk
      try {
        const response = await fetchWithCSRF('/mcp/api/external-user-id');
        
        if (response.ok) {
          const data = await response.json();
          if (data.externalUserId) {
            const userUuid = data.externalUserId;
            setSessionId(userUuid);
            // Store in session storage so it persists during navigation
            sessionStorage.setItem('pdExternalUserId', userUuid);
            return;
          }
        }
      } catch (error) {
        // Fallback to sessionStorage if server request fails
        const storedId = typeof window !== 'undefined' ? sessionStorage.getItem('pdExternalUserId') : null;
        if (storedId) {
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