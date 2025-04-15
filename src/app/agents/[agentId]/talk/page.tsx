"use client";

import { JSX, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AgentDBConfig } from "@/types/agent";
import { createLogger } from "@/utils/logger";
import { SessionControl, WidgetConfiguration } from "@audentic/react";
import {
  WidgetBuilderConfiguration,
  defaultWidgetConfig,
} from "@/types/widget";
import { ClipboardCheck, ClipboardCopy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const logger = createLogger("Talk Page");

export default function TalkAgentPage(): JSX.Element {
  const pathname = usePathname();
  const agentId = pathname.split("/").slice(-2)[0];
  const [agent, setAgent] = useState<AgentDBConfig | null>(null);
  const [widgetConfig, setWidgetConfig] =
    useState<WidgetBuilderConfiguration>(defaultWidgetConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [updates, setUpdates] = useState<{ id: string; value: any }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  function handleUpdates(updateArr: { id: string; value: any }[]) {
    // To update the previous value if the id already exists, filter out any existing update with the same id:
    setUpdates((prev) => [
      ...updateArr,
      ...prev.filter((u) => !updateArr.some((newU) => newU.id === u.id)),
    ]);
  }

  function handleCopy(update: { id: string; value: any }, idx: number) {
    const text = `${update.id}: ${
      typeof update.value === "string"
        ? update.value
        : JSON.stringify(update.value)
    }`;
    navigator.clipboard.writeText(text).then(
      () => setCopiedIndex(idx),
      () => setCopiedIndex(null)
    );
    setTimeout(() => setCopiedIndex(null), 1500);
  }

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
    <div className="space-y-6">
      <SessionControl
        agentId={agentId}
        maxOutputTokens={8192}
        widgetConfiguration={widgetConfig as WidgetConfiguration}
        updateForm={handleUpdates}
      />
      {updates.length > 0 && (
        <div className="w-full flex justify-center">
          <div className="w-3/4 mx-auto space-y-4 bg-muted/30 rounded-xl p-6 border border-border/30 shadow-sm">
            <h2 className="text-lg font-semibold text-center mb-2">
              Voice Updates
            </h2>
            {updates.map((update, idx) => (
              <Card
                key={idx}
                className="border border-border/40 shadow-sm hover:shadow transition-shadow"
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-mono text-xs text-gray-500">
                      {update.id}
                    </div>
                    <div className="break-all text-gray-800">
                      {typeof update.value === "string"
                        ? update.value
                        : JSON.stringify(update.value)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 p-2 rounded hover:bg-gray-100 transition"
                    onClick={() => handleCopy(update, idx)}
                    aria-label="Copy update"
                  >
                    {copiedIndex === idx ? (
                      <ClipboardCheck className="text-green-500 w-5 h-5" />
                    ) : (
                      <ClipboardCopy className="w-5 h-5" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
