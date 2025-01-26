"use client";

import { useEffect, useState } from "react";
import { AgentConfig } from "@audentic/react";
import { useAgents } from "@/hooks/useAgents";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AgentBuilder({ agentId }: { agentId: string }) {
  const { agents, loading, updateAgent, refreshAgents } = useAgents();
  const [isDirty, setIsDirty] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig | null>(null);

  // Add console logs to track state changes
  useEffect(() => {

    if (loading) return; // Don't do anything while loading

    if (agents.length > 0 && agentId) {
      const foundAgent = agents.find((a) => a.id === agentId);

      if (foundAgent) {
        setCurrentAgent(foundAgent);
        setIsDirty(false);
      } else {
        // If agent not found, trigger a refresh
        refreshAgents();
      }
    }
  }, [agents, agentId, loading, refreshAgents]);

  const handleUpdate = async () => {
    if (!currentAgent) return;
    try {
      await updateAgent(currentAgent.id, {
        name: currentAgent.name,
        instructions: currentAgent.instructions,
        firstMessage: currentAgent.firstMessage,
      });
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update agent:", error);
    }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded opacity-50 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="h-[100px] w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
  if (!currentAgent) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{currentAgent.name}</h1>
          <p className="text-muted-foreground mt-1">Agent Configuration</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg">Test Agent</Button>
          {isDirty && (
            <Button size="lg" onClick={handleUpdate}>
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">


        <Card>
          <CardHeader>
            <CardTitle>First Message</CardTitle>
            <CardDescription>
              The first message the agent will say. If empty, the agent will wait for the user to start the conversation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={currentAgent.firstMessage || ""}
              onChange={(e) => {
                setCurrentAgent({
                  ...currentAgent,
                  firstMessage: e.target.value
                });
                setIsDirty(true);
              }}
              placeholder="Enter the first message"
              className="min-h-[100px] resize-none focus-visible:ring-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>
              The system prompt is used to determine the persona of the agent and the context of the conversation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={currentAgent.instructions || ""}
              onChange={(e) => {
                setCurrentAgent({
                  ...currentAgent,
                  instructions: e.target.value
                });
                setIsDirty(true);
              }}
              placeholder="Enter system prompt"
              className="min-h-[200px] resize-none focus-visible:ring-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dynamic Variables</CardTitle>
            <CardDescription>
              Variables like {"{{user_name}}"} in your prompts and first message and dynamic variables in tool parameters will be replaced with actual values when the conversation starts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add dynamic variables configuration */}
          </CardContent>
        </Card>
      </div>


    </div >
  );
}
