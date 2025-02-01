"use client";

import { SessionControl } from "@audentic/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentDBConfig } from "@/agentBuilder/types";

export function FormAgent({
  agentId,
  agent,
}: {
  agentId: string;
  agent: AgentDBConfig;
}) {
  return (
    <div className="h-screen w-full p-6">
      <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg">
        <CardHeader className="items-center justify-between border-b">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(210,29%,16%)] to-[hsl(210,29%,36%)]">
            {agent.name} - Voice Form
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)] relative">
          <div className="absolute inset-0 overflow-auto p-4">
            <div className="border rounded-lg p-4 min-h-full">
              {/* Form will go here */}
              <p className="text-gray-500">Form placeholder</p>
            </div>
          </div>
          <div className="fixed bottom-10 right-10">
            <SessionControl agentId={agentId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
