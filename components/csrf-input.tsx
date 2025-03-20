'use client';

import { useCSRFToken, getCSRFTokenFromMeta } from './csrf-provider';

/**
 * CSRF Input component for forms
 * This adds a hidden input with the CSRF token value
 */
export function CSRFInput() {
  // Get token from context - this is more reliable and follows React patterns
  const csrfToken = useCSRFToken();
  
  // If context token is available, use it; otherwise use meta tag as fallback
  const tokenValue = csrfToken || getCSRFTokenFromMeta();
  
  return <input type="hidden" name="_csrf" value={tokenValue} />;
}