'use client';

import { useEffect } from 'react';

export default function ErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Suppress AbortError in console
      if (event.error?.name === 'AbortError') {
        event.preventDefault();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress AbortError in unhandled promises
      if (event.reason?.name === 'AbortError') {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}