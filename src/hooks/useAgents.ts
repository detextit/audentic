import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { AgentDBConfig } from "@/agentBuilder/types";

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
const CACHE_TTL = 300000; // 5 minutes cache TTL (increased from 1 minute)
let fetchPromise: Promise<AgentDBConfig[]> | null = null;

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
              setLoading(false); // Make sure to set loading to false on error
            }
            return agentsCache || [];
          })
          .finally(() => {
            fetchInProgress.current = false;
            fetchPromise = null;
            if (isMounted.current) {
              setLoading(false); // Ensure loading is set to false in finally block
            }
          });

        return fetchPromise;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        if (isMounted.current) {
          setError(errorMessage);
          setLoading(false); // Make sure to set loading to false on error
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
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const newAgent = await response.json();

      // Invalidate cache and fetch fresh data
      await fetchAgents(true);

      return newAgent;
    } catch (err: any) {
      console.error("Detailed error:", {
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

  useEffect(() => {
    if (userId) {
      // Always fetch immediately regardless of active tab
      // This ensures data is available when needed
      fetchAgents();
    }
  }, [userId, fetchAgents]);

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
