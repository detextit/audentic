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

export function useAgents() {
  const { userId } = useAuth();
  const [agents, setAgents] = useState<AgentDBConfig[]>(agentsCache || []);
  const [loading, setLoading] = useState(!agentsCache);
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
  const doFetchAgents = useCallback(
    async (forceRefresh = false) => {
      if (!userId || fetchInProgress.current) return agentsCache || [];

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
        const response = await fetch(`${baseUrl}/api/agents`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch agents");
        }
        const data = await response.json();

        // Update cache
        agentsCache = data;
        lastFetchTime = now;

        if (isMounted.current) {
          setAgents(data);
          setLoading(false);
        }
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        if (isMounted.current) {
          setError(errorMessage);
        }
        return agentsCache || [];
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
  const fetchAgents = useCallback(debounce(doFetchAgents, 300), [
    doFetchAgents,
  ]);

  const createAgent = async (input: AgentDBConfig) => {
    try {
      console.log("Creating agent with input:", input); // Debug log

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      console.log("Response status:", response.status); // Debug log
      console.log("Response status text:", response.statusText); // Debug log

      let errorMessage = "Failed to create agent";
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.log("Error data:", errorData); // Debug log
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError); // Debug log
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const newAgent = await response.json();
      console.log("Created agent:", newAgent); // Debug log

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
