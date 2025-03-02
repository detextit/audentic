"use client";

import { SessionControl } from "@audentic/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentDBConfig } from "@/agentBuilder/types";
export function TalkAgent({
  agentId,
  agent,
}: {
  agentId: string;
  agent: AgentDBConfig;
}) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg">
        <CardHeader className="items-center justify-between border-b">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(210,29%,16%)] to-[hsl(210,29%,36%)]">
            {agent.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col h-[70vh]">
            <div className="flex-grow flex items-end justify-end">
              <SessionControl agentId={agentId} maxOutputTokens={8192} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
