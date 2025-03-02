"use client";

import { JSX, useEffect, useState } from "react";
import { TalkAgent } from "@/app/agents/TalkAgent";
import { usePathname } from "next/navigation";
import { AgentDBConfig } from "@/agentBuilder/types";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Talk Page");

export default function TalkAgentPage(): JSX.Element {
  const pathname = usePathname();
  const agentId = pathname.split("/").slice(-2)[0];
  const [agent, setAgent] = useState<AgentDBConfig | null>(null);

  useEffect(() => {
    if (agentId) {
      fetch(`/api/agents/${agentId}`)
        .then((response) => response.json())
        .then((data) => setAgent(data))
        .catch((error) => logger.error("Error fetching agent:", error));
    }
  }, [agentId]);

  return agent ? (
    <TalkAgent agentId={agentId} agent={agent} />
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
