"use client";

import { SessionControl } from "@audentic/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TestAgent({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg">
        <CardHeader className="items-center justify-between border-b">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(210,29%,16%)] to-[hsl(210,29%,36%)]">
            Testing Agent: {agentName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col h-[70vh]">
            <div className="text-center mb-8">
              <p className="text-lg text-muted-foreground mb-2">
                Test your agent configuration in a live session
              </p>
              <p className="text-sm text-muted-foreground">
                Use the controls below to interact with your agent
              </p>
            </div>

            <div className="flex-grow flex items-end justify-end">
              <SessionControl
                transcript={true}
                agentId={agentId}
                maxOutputTokens={200}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
