"use client";

import { JSX, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AgentDBConfig } from "@/agentBuilder/types";
import { createLogger } from "@/utils/logger";
import { SessionControl, WidgetConfiguration } from "@audentic/react";
import {
  WidgetBuilderConfiguration,
  defaultWidgetConfig,
} from "@/types/widget";

const logger = createLogger("Talk Page");

export default function TalkAgentPage(): JSX.Element {
  const pathname = usePathname();
  const agentId = pathname.split("/").slice(-2)[0];
  const [agent, setAgent] = useState<AgentDBConfig | null>(null);
  const [widgetConfig, setWidgetConfig] =
    useState<WidgetBuilderConfiguration>(defaultWidgetConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (agentId) {
      // Fetch agent data
      fetch(`/api/agents/${agentId}`)
        .then((response) => response.json())
        .then((data) => setAgent(data))
        .catch((error) => logger.error("Error fetching agent:", error))
        .finally(() => setIsLoading(false));

      // Fetch widget configuration
      fetch(`/api/agents/${agentId}/widget-config`)
        .then((response) => response.json())
        .then((data) => {
          if (data.config) {
            setWidgetConfig(data.config);
            logger.debug("Widget configuration loaded:", data.config);
          }
        })
        .catch((error) => {
          logger.error("Error fetching widget configuration:", error);
          // We'll continue without widget config if it fails to load
        });
    }
  }, [agentId]);

  if (isLoading || !agent) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Pass the widget configuration to SessionControl if available
  return (
    <SessionControl
      agentId={agentId}
      maxOutputTokens={8192}
      widgetConfiguration={widgetConfig as WidgetConfiguration}
    />
  );
}
