"use client";

import { JSX, useEffect, useState } from "react";
import { TestAgent } from "../../TestAgent";
import { usePathname } from "next/navigation";
import { AgentDBConfig } from "@/agentBuilder/types";

export default function TestAgentPage(): JSX.Element {
  const pathname = usePathname();
  const agentId = pathname.split("/").slice(-2)[0];
  const [agent, setAgent] = useState<AgentDBConfig | null>(null);

  useEffect(() => {
    if (agentId) {
      fetch(`/api/agents/${agentId}`)
        .then((response) => response.json())
        .then((data) => setAgent(data))
        .catch((error) => console.error("Error fetching agent:", error));
    }
  }, [agentId]);

  return agent ? (
    <TestAgent agentId={agentId} agentName={agent.name} />
  ) : (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}
