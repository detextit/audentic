"use client";

import { useEffect, useState } from "react";
import { AgentDBConfig } from "@/agentBuilder/types";
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
import { Switch } from "@/components/ui/switch";
import { getVoiceAgentInstruction } from "@/agentBuilder/metaPrompts";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { fetchFormSchema } from "@/agentBuilder/processForm";

export function AgentBuilder({ agentId }: { agentId: string }) {
  const { agents, loading, updateAgent, refreshAgents } = useAgents();
  const { toast } = useToast();

  // Replace single isDirty with granular dirty states
  const [dirtyFields, setDirtyFields] = useState({
    description: false,
    personality: false,
    instructions: false,
    initiateConversation: false,
    settings: {
      useBrowserTools: false,
      isFormAgent: false,
      formUrl: false,
    },
  });

  const [currentAgent, setCurrentAgent] = useState<AgentDBConfig | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingInstructions, setIsUpdatingInstructions] = useState(false);

  // Helper to check if any fields are dirty
  const hasChanges = Object.values(dirtyFields).some((value) =>
    typeof value === "boolean" ? value : Object.values(value).some((v) => v)
  );

  // Helper to mark a field as dirty
  const markFieldDirty = (field: string, subField?: string) => {
    setDirtyFields((prev) => {
      if (subField) {
        return {
          ...prev,
          [field]: {
            ...(prev[field as keyof typeof prev] as Record<string, boolean>),
            [subField]: true,
          },
        };
      }
      return { ...prev, [field]: true };
    });
  };

  // Update the field change handlers
  const handleDescriptionChange = (value: string) => {
    setCurrentAgent((prev) => (prev ? { ...prev, description: value } : null));
    markFieldDirty("description");
  };

  const handleSettingChange = (setting: string, value: any) => {
    setCurrentAgent((prev) =>
      prev
        ? {
            ...prev,
            settings: {
              ...prev.settings,
              [setting]: value,
            },
          }
        : null
    );
    markFieldDirty("settings", setting);
  };

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    if (agents.length > 0 && agentId) {
      const foundAgent = agents.find((a) => a.id === agentId);

      if (foundAgent) {
        setCurrentAgent(foundAgent);
        setDirtyFields({
          description: false,
          personality: false,
          instructions: false,
          initiateConversation: false,
          settings: {
            useBrowserTools: false,
            isFormAgent: false,
            formUrl: false,
          },
        });
      } else {
        // If agent not found, trigger a refresh
        refreshAgents();
      }
    }
  }, [agents, agentId, loading, refreshAgents]);

  const handleUpdate = async () => {
    if (!currentAgent) return;
    setIsUpdating(true);

    try {
      // Only update fields that are dirty
      const updates: Partial<AgentDBConfig> = {};

      if (dirtyFields.description)
        updates.description = currentAgent.description;
      if (dirtyFields.personality)
        updates.personality = currentAgent.personality;

      if (Object.values(dirtyFields.settings).some((v) => v)) {
        updates.settings = currentAgent.settings;
      }

      if (Object.keys(updates).length > 0) {
        await updateAgent(currentAgent.id, updates);
      }

      // Only update instructions if description or personality changed
      if (dirtyFields.description || dirtyFields.personality) {
        setIsUpdatingInstructions(true);
        getVoiceAgentInstruction(
          currentAgent.description,
          currentAgent.personality
        )
          .then(async (instructions) => {
            await updateAgent(currentAgent.id, { instructions });
            setIsUpdatingInstructions(false);
            toast({
              title: `${currentAgent.name} Updated`,
              description: "Your agent is deployed and ready to go!",
            });
          })
          .catch((error) => {
            console.error("Failed to update instructions:", error);
            toast({
              variant: "destructive",
              title: "Uh oh! Something went wrong.",
              description: "Failed to deploy agent. Contact support.",
            });
            setIsUpdatingInstructions(false);
          });

        toast({
          title: "Agent Deploying...",
          description: "Your agent is being deployed and will be ready soon!",
        });
      } else {
        toast({
          title: `${currentAgent.name} Updated`,
          description: "Your agent is deployed and ready to go!",
        });
      }

      // Reset dirty states
      setDirtyFields({
        description: false,
        personality: false,
        instructions: false,
        initiateConversation: false,
        settings: {
          useBrowserTools: false,
          isFormAgent: false,
          formUrl: false,
        },
      });

      setIsUpdating(false);
    } catch (error) {
      console.error("Failed to update agent:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Failed to update. Contact support.",
      });
      setIsUpdating(false);
      setIsUpdatingInstructions(false);
    }
  };

  const handleTestClick = () => {
    // Open in new tab
    window.open(`/agents/${agentId}/talk`, "_blank");
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
          <Button onClick={handleUpdate} disabled={isUpdating || !hasChanges}>
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
              The description is used to build the agent&apos;s task
              instructions and the step-by-step flow for the agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={currentAgent.description || ""}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder={`Enter the role as well as any key flow steps... e.g. 'you are a friendly teacher who helps students with their homework'`}
              className="min-h-[100px] resize-none focus-visible:ring-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality</CardTitle>
            <CardDescription>
              Setup the agent&apos;s tone, demeanor, and other personality
              traits.
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
                markFieldDirty("personality");
              }}
              placeholder="Enter personality... e.g. 'friendly, patient, professional language'"
              className="min-h-[100px] resize-none focus-visible:ring-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Customize the agent&apos;s behavior and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="initiate"
                checked={currentAgent.initiateConversation}
                onCheckedChange={(checked) => {
                  setCurrentAgent({
                    ...currentAgent,
                    initiateConversation: checked,
                  });
                  markFieldDirty("settings", "initiateConversation");
                }}
              />
              <Label
                htmlFor="initiate"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-initiate conversation
              </Label>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="useBrowserTools"
                checked={currentAgent.settings?.useBrowserTools}
                onCheckedChange={(checked) =>
                  handleSettingChange("useBrowserTools", checked)
                }
              />
              <Label
                htmlFor="useBrowserTools"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use browser tools
              </Label>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="isFormAgent"
                checked={currentAgent.settings?.isFormAgent}
                onCheckedChange={(checked) => {
                  setCurrentAgent({
                    ...currentAgent,
                    settings: {
                      ...currentAgent.settings,
                      isFormAgent: checked,
                      formUrl: checked
                        ? currentAgent.settings?.formUrl || ""
                        : undefined,
                    },
                  });
                  markFieldDirty("settings", "isFormAgent");
                }}
              />
              <Label
                htmlFor="isFormAgent"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Form Processing Agent
              </Label>
            </div>

            {currentAgent.settings?.isFormAgent && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="formUrl">Google Form URL</Label>
                <Input
                  id="formUrl"
                  type="url"
                  placeholder="Enter Google Form URL"
                  value={currentAgent.settings?.formUrl || ""}
                  onChange={(e) => {
                    setCurrentAgent({
                      ...currentAgent,
                      settings: {
                        ...currentAgent.settings,
                        formUrl: e.target.value,
                      },
                    });
                    fetchFormSchema(e.target.value).then((schema) => {
                      console.log(schema);
                    });
                    markFieldDirty("settings", "formUrl");
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
