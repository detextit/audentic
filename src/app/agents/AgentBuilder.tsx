"use client";

import { useEffect, useState } from "react";
import { AgentDBConfig, KnowledgeBaseArticle } from "@/agentBuilder/types";
import { getVoiceAgentInstruction } from "@/agentBuilder/metaPrompts";
import { fetchFormSchema } from "@/agentBuilder/processForm";

import { useAgents } from "@/hooks/useAgents";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";

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
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { KnowledgeBaseEditor } from "./KnowledgeBaseEditor";

export function AgentBuilder({ agentId }: { agentId: string }) {
  const { agents, loading, updateAgent, refreshAgents } = useAgents();
  const {
    articles: existingArticles,
    createArticles,
    fetchArticles,
    loading: loadingArticles,
  } = useKnowledgeBase();
  const { toast } = useToast();

  const [dirtyFields, setDirtyFields] = useState({
    description: false,
    personality: false,
    instructions: false,
    initiateConversation: false,
    settings: {
      useBrowserTools: false,
      isFormAgent: false,
      formSchema: false,
      knowledgeBase: false,
      isAdvancedModel: false,
    },
  });

  const [currentAgent, setCurrentAgent] = useState<AgentDBConfig | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [pendingKnowledgeBaseArticles, setPendingKnowledgeBaseArticles] =
    useState<KnowledgeBaseArticle[]>([]);

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

  const resetDirtyFields = () => {
    setDirtyFields({
      description: false,
      personality: false,
      instructions: false,
      initiateConversation: false,
      settings: {
        useBrowserTools: false,
        isFormAgent: false,
        formSchema: false,
        knowledgeBase: false,
        isAdvancedModel: false,
      },
    });
  };

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    if (agents.length > 0 && agentId) {
      const foundAgent = agents.find((a) => a.id === agentId);
      if (foundAgent) {
        setCurrentAgent(foundAgent);
        resetDirtyFields();
      } else {
        refreshAgents();
      }
    }
  }, [agents, agentId, loading, refreshAgents]);

  useEffect(() => {
    if (currentAgent?.id) {
      fetchArticles(currentAgent.id);
    }
  }, [currentAgent?.id, fetchArticles]);

  const handleAsyncUpdate = async ({
    condition,
    handler,
    name,
  }: {
    condition: boolean;
    handler: () => Promise<void>;
    name: string;
  }) => {
    if (!condition) return;

    setIsUpdatingAgent(true);
    toast({
      title: "Agent Deploying...",
      description: `Updating ${name}...`,
    });

    try {
      await handler();
    } catch (error) {
      console.error(`Failed to update ${name}:`, error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Failed to update ${name}. Contact support.`,
      });
    }
  };

  const handleKnowledgeBaseArticle = (article: KnowledgeBaseArticle) => {
    setPendingKnowledgeBaseArticles((prev) => [...prev, article]);
    markFieldDirty("settings", "knowledgeBase");
  };

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
      if (dirtyFields.initiateConversation)
        updates.initiateConversation = currentAgent.initiateConversation;
      if (Object.values(dirtyFields.settings).some((v) => v))
        updates.settings = currentAgent.settings;

      if (Object.keys(updates).length > 0) {
        await updateAgent(currentAgent.id, updates);
      }

      // Handle all async updates
      const asyncUpdates = [
        // Instruction update
        {
          condition: dirtyFields.description || dirtyFields.personality,
          handler: async () => {
            const instructions = await getVoiceAgentInstruction(
              currentAgent.description,
              currentAgent.personality
            );
            updateAgent(currentAgent.id, { instructions });
          },
          name: "instructions",
        },
        // Form schema update
        {
          condition: dirtyFields.settings.formSchema,
          handler: async () => {
            if (!currentAgent.settings?.formSchema?.url) {
              await updateAgent(currentAgent.id, {
                settings: { ...currentAgent.settings, isFormAgent: false },
              });
              throw new Error("Form agent without URL");
            }
            const formSchema = await fetchFormSchema(
              currentAgent.settings.formSchema.url
            );
            updateAgent(currentAgent.id, {
              settings: {
                ...currentAgent.settings,
                formSchema: {
                  ...formSchema,
                  url: currentAgent.settings.formSchema.url,
                },
              },
            });
          },
          name: "form schema",
        },
        // Knowledge base update
        {
          condition: dirtyFields.settings.knowledgeBase,
          handler: async () => {
            if (pendingKnowledgeBaseArticles.length > 0) {
              const newArticles = await createArticles(
                currentAgent.id,
                pendingKnowledgeBaseArticles
              );

              // Update agent settings with all articles
              updateAgent(currentAgent.id, {
                settings: {
                  ...currentAgent.settings,
                  knowledgeBase: [
                    ...(currentAgent.settings?.knowledgeBase || []),
                    ...newArticles.map((article) => ({
                      id: article.id,
                      title: article.title,
                      updatedAt: article.updatedAt,
                    })),
                  ],
                },
              });

              setPendingKnowledgeBaseArticles([]);
            }
          },
          name: "knowledge base",
        },
      ];

      // Execute all async updates in parallel
      await Promise.all(
        asyncUpdates.map((update) => handleAsyncUpdate(update))
      );

      // Show success toast only after all updates complete
      toast({
        title: `${currentAgent.name} Updated`,
        description: "Your agent is deployed and ready to go!",
      });

      resetDirtyFields();
    } catch (error) {
      console.error("Failed to update agent:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update. Contact support.",
      });
    } finally {
      setIsUpdating(false);
      setIsUpdatingAgent(false);
    }
  };

  const handleTestClick = () => {
    // Open in new tab
    if (currentAgent?.settings?.isFormAgent) {
      window.open(`/agents/${agentId}/form`, "_blank");
    } else {
      window.open(`/agents/${agentId}/talk`, "_blank");
    }
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
            disabled={isUpdatingAgent}
          >
            {isUpdatingAgent ? "Deploying Agent..." : "Test Agent"}
          </Button>
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Description</CardTitle>
            <CardDescription>
              The description is used to build the instructions and the
              step-by-step flow for the agent.
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
                markFieldDirty("description");
              }}
              placeholder={`Describe the agent's task as well as any key flow steps... e.g. 'you are a friendly teacher who helps students with their homework'`}
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
            <Input
              value={currentAgent.personality || ""}
              onChange={(e) => {
                setCurrentAgent({
                  ...currentAgent,
                  personality: e.target.value,
                });
                markFieldDirty("personality");
              }}
              placeholder="Enter personality... e.g. 'friendly, patient, professional language'"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>
              Manage information that the agent can reference when answering
              questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KnowledgeBaseEditor
              onArticleChange={handleKnowledgeBaseArticle}
              pendingArticles={pendingKnowledgeBaseArticles}
              existingArticles={existingArticles}
              isLoading={loadingArticles}
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
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="agentType"
                checked={currentAgent.settings?.isAdvancedModel}
                onCheckedChange={(checked) => {
                  setCurrentAgent({
                    ...currentAgent,
                    settings: {
                      ...currentAgent.settings,
                      isAdvancedModel: checked,
                    },
                  });
                  markFieldDirty("settings", "isAdvancedModel");
                }}
              />
              <Label
                htmlFor="agentType"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use Advanced Model
              </Label>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="initiate"
                checked={currentAgent.initiateConversation}
                onCheckedChange={(checked) => {
                  setCurrentAgent({
                    ...currentAgent,
                    initiateConversation: checked,
                  });
                  markFieldDirty("initiateConversation");
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
                onCheckedChange={(checked) =>
                  handleSettingChange("isFormAgent", checked)
                }
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
                  value={currentAgent.settings?.formSchema?.url || ""}
                  onChange={(e) =>
                    handleSettingChange("formSchema", {
                      // if url is changed, everything in the schema is invalidated
                      url: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
