import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Session } from "@/components/history-sidebar";

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Cache for sessions data
let sessionsCache: Session[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 300000; // 5 minutes cache TTL
let fetchPromise: Promise<Session[]> | null = null;
let pendingFetchTimeout: NodeJS.Timeout | null = null;

export function useSessions() {
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>(sessionsCache || []);
  const [loading, setLoading] = useState(!sessionsCache);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const isActiveTab = useRef(false);

  // Check if this is the active tab based on URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkActiveTab = () => {
        const path = window.location.pathname;
        isActiveTab.current = path.startsWith("/history");
      };

      // Check initially
      checkActiveTab();

      // Listen for URL changes
      const handleUrlChange = () => {
        checkActiveTab();
      };

      window.addEventListener("popstate", handleUrlChange);
      return () => window.removeEventListener("popstate", handleUrlChange);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // The actual fetch function
  const doFetchSessions = useCallback(
    async (forceRefresh = false) => {
      if (!userId) return sessionsCache || [];

      // If there's already a fetch in progress, return its promise
      if (fetchPromise && !forceRefresh) {
        return fetchPromise;
      }

      if (fetchInProgress.current && !forceRefresh) return sessionsCache || [];

      // Clear any pending fetch timeout
      if (pendingFetchTimeout) {
        clearTimeout(pendingFetchTimeout);
        pendingFetchTimeout = null;
      }

      fetchInProgress.current = true;

      // Use cache if available and not expired, unless force refresh is requested
      const now = Date.now();
      if (!forceRefresh && sessionsCache && now - lastFetchTime < CACHE_TTL) {
        if (isMounted.current) {
          setSessions(sessionsCache);
          setLoading(false);
        }
        fetchInProgress.current = false;
        return sessionsCache;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Create a new fetch promise and store it
        fetchPromise = fetch(`${baseUrl}/api/sessions`)
          .then((response) => {
            if (!response.ok) {
              return response.json().then((errorData) => {
                throw new Error(errorData.error || "Failed to fetch sessions");
              });
            }
            return response.json();
          })
          .then((data) => {
            // Update cache
            sessionsCache = data;
            lastFetchTime = now;

            if (isMounted.current) {
              setSessions(data);
              setLoading(false);
            }
            return data;
          })
          .catch((err) => {
            const errorMessage =
              err instanceof Error ? err.message : "An error occurred";
            if (isMounted.current) {
              setError(errorMessage);
              setLoading(false);
            }
            return sessionsCache || [];
          })
          .finally(() => {
            fetchInProgress.current = false;
            fetchPromise = null;
            if (isMounted.current) {
              setLoading(false);
            }
          });

        return fetchPromise;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        if (isMounted.current) {
          setError(errorMessage);
          setLoading(false);
        }
        fetchInProgress.current = false;
        fetchPromise = null;
        return sessionsCache || [];
      }
    },
    [userId]
  );

  // Debounced version to prevent multiple rapid calls
  const fetchSessions = useCallback(debounce(doFetchSessions, 300), [
    doFetchSessions,
  ]);

  // Fetch sessions on mount, but with a slight delay if not the active tab
  useEffect(() => {
    if (!userId) return;

    // If we already have cached data, use it immediately
    if (sessionsCache) {
      setSessions(sessionsCache);
      setLoading(false);

      // Only refresh if cache is stale
      const now = Date.now();
      if (now - lastFetchTime >= CACHE_TTL) {
        // Fetch with a delay if not the active tab
        if (!isActiveTab.current) {
          pendingFetchTimeout = setTimeout(() => doFetchSessions(false), 2000);
        } else {
          doFetchSessions(false);
        }
      }
    } else {
      // No cache, fetch immediately
      doFetchSessions(true);
    }

    return () => {
      if (pendingFetchTimeout) {
        clearTimeout(pendingFetchTimeout);
      }
    };
  }, [userId, doFetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
  };
}
