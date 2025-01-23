"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AgentConfig } from "@voiceact/mabel/types";
import { useAgents } from "@/hooks/useAgents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AgentBuilder() {
  const { id } = useParams();
  const { agents, updateAgent } = useAgents();
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const currentAgent = agents.find((a) => a.id === id);
    if (currentAgent) {
      setAgent(currentAgent);
    }
  }, [agents, id]);

  const handleUpdate = async () => {
    if (!agent) return;
    await updateAgent(agent.id, agent);
    setIsDirty(false);
  };

  if (!agent) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">Agent Configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Test Agent</Button>
          {isDirty && <Button onClick={handleUpdate}>Save Changes</Button>}
        </div>
      </div>

      <Tabs defaultValue="agent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agent">Agent</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
        </TabsList>

        <TabsContent value="agent">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>First Message</CardTitle>
                <CardDescription>
                  The first message the agent will say. If empty, the agent will
                  wait for the user to start the conversation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={agent.firstMessage || ""}
                  onChange={(e) => {
                    setAgent({ ...agent, firstMessage: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Enter the first message"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>
                  The system prompt is used to determine the persona of the
                  agent and the context of the conversation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={agent.instructions || ""}
                  onChange={(e) => {
                    setAgent({ ...agent, instructions: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Enter system prompt"
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dynamic Variables</CardTitle>
                <CardDescription>
                  Variables like {"{{user_name}}"} in your prompts and first
                  message and dynamic variables in tool parameters will be
                  replaced with actual values when the conversation starts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add dynamic variables configuration */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice">{/* Voice configuration */}</TabsContent>
        <TabsContent value="analysis">
          {/* Analysis configuration */}
        </TabsContent>
        <TabsContent value="security">
          {/* Security configuration */}
        </TabsContent>
        <TabsContent value="advanced">
          {/* Advanced configuration */}
        </TabsContent>
        <TabsContent value="widget">{/* Widget configuration */}</TabsContent>
      </Tabs>
    </div>
  );
}
