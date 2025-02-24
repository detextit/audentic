import { useState } from "react";

export function useMcpServers() {
  const [loading, setLoading] = useState(false);

  const getMcpServers = async (agentId: string) => {
    if (!agentId) return [];

    setLoading(true);
    try {
      const response = await fetch(`/api/mcp-servers/${agentId}`);
      if (!response.ok) throw new Error("Failed to get MCP servers");
      return await response.json();
    } catch (error) {
      console.error("Failed to get MCP servers:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveMcpServer = async (
    agentId: string,
    server: { name: string; env: Record<string, string> }
  ) => {
    if (!agentId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/mcp-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, server }),
      });
      if (!response.ok) throw new Error("Failed to save MCP server");
    } finally {
      setLoading(false);
    }
  };

  const deleteMcpServer = async (agentId: string, serverName: string) => {
    if (!agentId || !serverName) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/mcp-servers/${agentId}/${serverName}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete MCP server");
    } finally {
      setLoading(false);
    }
  };

  return { loading, getMcpServers, saveMcpServer, deleteMcpServer };
}
