"use client";

import { SessionControlWithTranscript } from "@audentic/react";
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
            <div className="flex-1 min-h-0 w-full">
              <SessionControlWithTranscript
                agentId={agentId}
                transcriptHeight={380}
                transcriptWidth={450}
              />
            </div>
            {/* <div>
                            <SessionControl title="Get Started" width="300" backgroundColor="bg-neutral-50" callAgentButtonTitle="Build Agent" agentId={agentId} />
                        </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
