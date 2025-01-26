import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { AgentConfig } from "@audentic/react";
import { CreateAgentInput } from "@/agentBuilder/types";
export function useAgents() {
  const { userId } = useAuth();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/agents`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch agents");
      }
      const data = await response.json();
      setAgents(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (input: CreateAgentInput) => {
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

      await fetchAgents();

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
    updates: Partial<CreateAgentInput>
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
      setAgents((prev) =>
        prev.map((agent) => (agent.id === agentId ? updatedAgent : agent))
      );
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

      setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
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
  }, [userId]);

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
