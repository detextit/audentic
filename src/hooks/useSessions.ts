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
const CACHE_TTL = 300000; // 5 minutes cache TTL (increased from 1 minute)

export function useSessions() {
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>(sessionsCache || []);
  const [loading, setLoading] = useState(!sessionsCache);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // The actual fetch function
  const doFetchSessions = useCallback(
    async (forceRefresh = false) => {
      if (!userId || fetchInProgress.current) return sessionsCache || [];

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
        const response = await fetch(`${baseUrl}/api/sessions`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch sessions");
        }
        const data = await response.json();

        // Update cache
        sessionsCache = data;
        lastFetchTime = now;

        if (isMounted.current) {
          setSessions(data);
          setLoading(false);
        }
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        if (isMounted.current) {
          setError(errorMessage);
        }
        return sessionsCache || [];
      } finally {
        fetchInProgress.current = false;
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [userId]
  );

  // Debounced version to prevent multiple rapid calls
  const fetchSessions = useCallback(debounce(doFetchSessions, 300), [
    doFetchSessions,
  ]);

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId, fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
  };
}
