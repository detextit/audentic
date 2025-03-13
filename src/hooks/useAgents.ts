import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { AgentDBConfig } from "@/types/agent";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Use Agents");

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

// Cache for agents data
let agentsCache: AgentDBConfig[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 300000; // 5 minutes cache TTL
let fetchPromise: Promise<AgentDBConfig[]> | null = null;
let pendingFetchTimeout: NodeJS.Timeout | null = null;

export function useAgents() {
  const { userId } = useAuth();
  const [agents, setAgents] = useState<AgentDBConfig[]>(agentsCache || []);
  const [loading, setLoading] = useState(!agentsCache);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const isActiveTab = useRef(false);

  // Check if this is the active tab based on URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkActiveTab = () => {
        const path = window.location.pathname;
        isActiveTab.current = path === "/" || path.startsWith("/agents");
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
  const doFetchAgents = useCallback(
    async (forceRefresh = false) => {
      if (!userId) return agentsCache || [];

      // If there's already a fetch in progress, return its promise
      if (fetchPromise && !forceRefresh) {
        return fetchPromise;
      }

      if (fetchInProgress.current && !forceRefresh) return agentsCache || [];

      // Clear any pending fetch timeout
      if (pendingFetchTimeout) {
        clearTimeout(pendingFetchTimeout);
        pendingFetchTimeout = null;
      }

      fetchInProgress.current = true;

      // Use cache if available and not expired, unless force refresh is requested
      const now = Date.now();
      if (!forceRefresh && agentsCache && now - lastFetchTime < CACHE_TTL) {
        if (isMounted.current) {
          setAgents(agentsCache);
          setLoading(false);
        }
        fetchInProgress.current = false;
        return agentsCache;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Create a new fetch promise and store it
        fetchPromise = fetch(`${baseUrl}/api/agents`)
          .then((response) => {
            if (!response.ok) {
              return response.json().then((errorData) => {
                throw new Error(errorData.error || "Failed to fetch agents");
              });
            }
            return response.json();
          })
          .then((data) => {
            // Update cache
            agentsCache = data;
            lastFetchTime = now;

            if (isMounted.current) {
              setAgents(data);
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
            return agentsCache || [];
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
        return agentsCache || [];
      }
    },
    [userId]
  );

  // Debounced version to prevent multiple rapid calls
  const fetchAgents = useCallback(debounce(doFetchAgents, 300), [
    doFetchAgents,
  ]);

  // Fetch agents on mount, but with a slight delay if not the active tab
  useEffect(() => {
    if (!userId) return;

    // If we already have cached data, use it immediately
    if (agentsCache) {
      setAgents(agentsCache);
      setLoading(false);

      // Only refresh if cache is stale
      const now = Date.now();
      if (now - lastFetchTime >= CACHE_TTL) {
        // Fetch with a delay if not the active tab
        if (!isActiveTab.current) {
          pendingFetchTimeout = setTimeout(() => doFetchAgents(false), 2000);
        } else {
          doFetchAgents(false);
        }
      }
    } else {
      // No cache, fetch immediately
      doFetchAgents(true);
    }

    return () => {
      if (pendingFetchTimeout) {
        clearTimeout(pendingFetchTimeout);
      }
    };
  }, [userId, doFetchAgents]);

  const createAgent = async (input: AgentDBConfig) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      let errorMessage = "Failed to create agent";
      if (!response.ok) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (error) {
          errorMessage =
            response.statusText || `Failed to create agent: ${error}`;
        }
        throw new Error(errorMessage);
      }

      const newAgent = await response.json();

      // Invalidate cache and fetch fresh data
      await fetchAgents(true);

      return newAgent;
    } catch (err: any) {
      logger.error("Detailed error:", {
        error: err,
        message: err.message,
        stack: err.stack,
      });
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create agent";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateAgent = async (
    agentId: string,
    updates: Partial<AgentDBConfig>
  ) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/agents?id=${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update agent");
      }

      const updatedAgent = await response.json();

      // Update local state and cache
      const updatedAgents = agents.map((agent) =>
        agent.id === agentId ? updatedAgent : agent
      );

      setAgents(updatedAgents);
      agentsCache = updatedAgents;
      lastFetchTime = Date.now();

      return updatedAgent;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update agent";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/agents?id=${agentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete agent");
      }

      // Update local state and cache
      const updatedAgents = agents.filter((agent) => agent.id !== agentId);
      setAgents(updatedAgents);
      agentsCache = updatedAgents;
      lastFetchTime = Date.now();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete agent";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    refreshAgents: fetchAgents,
  };
}
