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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SessionControl } from "@audentic/react";
import { getVoiceAgentInstruction } from "@/agentBuilder/metaPrompts";
import { useToast } from "@/hooks/use-toast";

export function AgentBuilder({ agentId }: { agentId: string }) {
  const { agents, loading, updateAgent, refreshAgents } = useAgents();
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingInstructions, setIsUpdatingInstructions] = useState(false);

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
    setIsUpdating(true);
    setIsUpdatingInstructions(true);
    try {
      // Do the main update first
      await updateAgent(currentAgent.id, {
        name: currentAgent.name,
        description: currentAgent.description,
        personality: currentAgent.personality,
        initiateConversation: currentAgent.initiateConversation,
      });

      setIsUpdating(false);
      setIsDirty(false);
      toast({
        title: "Success",
        description: "Agent updated successfully",
      });

      // Update instructions in the background
      getVoiceAgentInstruction(
        currentAgent.description,
        currentAgent.personality
      )
        .then(async (instructions) => {
          await updateAgent(currentAgent.id, { instructions });
          setIsUpdatingInstructions(false);
        })
        .catch((error) => {
          console.error("Failed to update instructions:", error);
          setIsUpdatingInstructions(false);
        });
    } catch (error) {
      console.error("Failed to update agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agent. Please try again.",
      });
      setIsUpdating(false);
      setIsUpdatingInstructions(false);
    }
  };

  const handleTestClick = () => {
    // Open in new tab
    window.open(`/agents/${agentId}/test`, "_blank");
  };

  if (loading)
    return (
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
          <h1 className="text-3xl font-semibold tracking-tight">
            {currentAgent.name}
          </h1>
          <p className="text-muted-foreground mt-1">Agent Configuration</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || !isDirty}
          >
            Save
          </Button>
          <Button
            variant="outline"
            onClick={handleTestClick}
            disabled={isUpdatingInstructions}
          >
            {isUpdatingInstructions ? "Deploying Agent..." : "Test Agent"}
          </Button>
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Description</CardTitle>
            <CardDescription>
              The description is used to build the agent's task instructions and
              the step-by-step flow for the agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={currentAgent.description || ""}
              onChange={(e) => {
                setCurrentAgent({
                  ...currentAgent,
                  description: e.target.value,
                });
                setIsDirty(true);
              }}
              placeholder="Enter the role as well as any key flow steps... e.g. 'you are a friendly teacher who helps students with their homework'"
              className="min-h-[100px] resize-none focus-visible:ring-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality</CardTitle>
            <CardDescription>
              Setup the agent's tone, demeanor, and other personality traits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={currentAgent.personality || ""}
              onChange={(e) => {
                setCurrentAgent({
                  ...currentAgent,
                  personality: e.target.value,
                });
                setIsDirty(true);
              }}
              placeholder="Enter personality... e.g. 'friendly, patient, professional language'"
              className="min-h-[100px] resize-none focus-visible:ring-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Settings</CardTitle>
            <CardDescription>
              Configure how the agent handles conversation flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="initiate"
                checked={!!currentAgent.initiateConversation}
                onCheckedChange={(checked) => {
                  let newAgent = currentAgent;
                  newAgent.initiateConversation = checked ? true : false;
                  setCurrentAgent(newAgent);
                  setIsDirty(true);
                }}
              />
              <label
                htmlFor="initiate"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Agent initiates conversation
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
