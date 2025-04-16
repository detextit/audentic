"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AgentDBConfig,
  KnowledgeBaseArticle,
  KnowledgeBaseDBArticle,
} from "@/types/agent";
import { getVoiceAgentInstruction } from "@/agentBuilder/metaPrompts";
import { fetchFormSchema } from "@/agentBuilder/processForm";

import { useAgents } from "@/hooks/useAgents";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { useMcpServers } from "@/hooks/useMcpServers";

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
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, PlusCircle, HelpCircle, Copy, Check } from "lucide-react";
import { AVAILABLE_MCP_SERVERS } from "@/mcp/servers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Widget } from "./WidgetConfiguration";
import { WidgetBuilderConfiguration } from "@/types/widget";
import { createLogger } from "@/utils/logger";
import ToolDialog, { ToolDialogProps } from "./ToolDialog";
import type { Tool } from "@/types/agent";

// Create a logger instance for this component
const logger = createLogger("Agent Builder");

export function AgentBuilder({ agentId }: { agentId: string }) {
  const router = useRouter();
  const { agents, loading, updateAgent, deleteAgent } = useAgents();
  const {
    articles: existingArticles,
    createArticles,
    deleteArticle,
    fetchArticles,
    loading: loadingArticles,
  } = useKnowledgeBase();
  const { toast } = useToast();
  const { getMcpServers, saveMcpServer, deleteMcpServer } = useMcpServers();

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
      mcpServers: false,
    },
    webUI: false,
    widgetConfig: false,
    tools: false,
    toolLogic: false,
  });

  const [copied, setCopied] = useState(false);
  // Generate embed code based on current configuration
  const generateEmbedCode = () => {
    return `<audentic-embed agent-id="${
      currentAgent?.id
    }" max-output-tokens="1024" widget-configuration='${JSON.stringify(
      widgetConfig
    )}'></audentic-embed>
    <script src="https://unpkg.com/@audentic/react/dist/embed.js" async type="text/javascript"></script>`;
  };

  const handleCopy = async () => {
    const dataToCopy = generateEmbedCode();
    await navigator.clipboard.writeText(dataToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [currentAgent, setCurrentAgent] = useState<AgentDBConfig | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [pendingKnowledgeBaseArticles, setPendingKnowledgeBaseArticles] =
    useState<KnowledgeBaseArticle[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [mcpServers, setMcpServers] = useState<
    Array<{
      name: string;
      env: Record<string, string>;
    }>
  >([]);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [pendingMcpServers, setPendingMcpServers] = useState<
    Array<{ name: string; env: Record<string, string> }>
  >([]);
  const [invalidFields, setInvalidFields] = useState<Record<string, string[]>>(
    {}
  );

  // Add state for widget configuration
  const [widgetConfig, setWidgetConfig] =
    useState<WidgetBuilderConfiguration | null>(null);
  const [isWidgetConfigLoading, setIsWidgetConfigLoading] = useState(true);

  // Add state for addToolDialogOpen
  const [addToolDialogOpen, setAddToolDialogOpen] = useState(false);

  // Helper to check if any fields are dirty
  const hasChanges = useMemo(
    () =>
      Object.values(dirtyFields).some((value) =>
        typeof value === "boolean" ? value : Object.values(value).some((v) => v)
      ),
    [dirtyFields]
  );

  // Helper to check if there are any invalid fields
  const hasInvalidFields = useMemo(
    () => Object.keys(invalidFields).length > 0,
    [invalidFields]
  );

  // Helper to mark a field as dirty
  const markFieldDirty = useCallback((field: string, subField?: string) => {
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
  }, []);

  const handleSettingChange = useCallback(
    (setting: string, value: any) => {
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
    },
    [markFieldDirty]
  );

  const resetDirtyFields = useCallback(() => {
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
        mcpServers: false,
      },
      webUI: false,
      widgetConfig: false,
      tools: false,
      toolLogic: false,
    });
  }, []);

  useEffect(() => {
    logger.debug("AgentBuilder useEffect", {
      agentId,
      agentsLength: agents.length,
      loading,
    });

    if (agents.length > 0) {
      const agent = agents.find((a) => a.id === agentId);
      if (agent) {
        logger.info("Found agent:", agent.name);
        setCurrentAgent(agent);
        resetDirtyFields();
      } else {
        logger.error(`Agent with ID ${agentId} not found`);
        // If the agent isn't found but we have other agents, redirect to the first one
        if (agents.length > 0) {
          router.push(`/agents/${agents[0].id}`);
        }
      }
    }
  }, [agentId, agents, router, resetDirtyFields]);

  useEffect(() => {
    if (currentAgent?.id) {
      fetchArticles(currentAgent.id);
    }
  }, [currentAgent?.id, fetchArticles]);

  // Load MCP servers from database when agent loads
  useEffect(() => {
    if (!currentAgent?.id) return;

    const loadMcpServers = async () => {
      try {
        const servers = await getMcpServers(currentAgent.id);
        setMcpServers(servers);
      } catch (error) {
        logger.error("Failed to load MCP servers:", error);
      }
    };

    loadMcpServers();
  }, [currentAgent?.id]);

  // When dialog opens, initialize pending servers with current servers
  useEffect(() => {
    if (integrationDialogOpen) {
      setPendingMcpServers(mcpServers);
    }
  }, [integrationDialogOpen]);

  // Load widget configuration when agent loads
  useEffect(() => {
    if (!currentAgent?.id) return;

    const loadWidgetConfig = async () => {
      setIsWidgetConfigLoading(true);
      try {
        const response = await fetch(
          `/api/agents/${currentAgent.id}/widget-config`
        );

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          setIsWidgetConfigLoading(false);
          return;
        }

        const data = await response.json();

        if (data.config) {
          setWidgetConfig(data.config);
        } else {
          // Set default widget config if none exists
          setWidgetConfig({
            showBackgroundCard: true,
            title: "Need Help?",
            backgroundColor: "#FFFFFF",
            textColor: "#666666",
            width: "200",
            height: "110",
            buttonText: "Voice Agent",
            primaryColor: "#000000",
            buttonTextColor: "#FFFFFF",
            borderRadius: "12",
          });
        }
      } catch (error) {
        console.error("Error loading widget configuration:", error);
        toast({
          title: "Error",
          description: "Failed to load widget configuration. Using defaults.",
          variant: "destructive",
        });
      } finally {
        setIsWidgetConfigLoading(false);
      }
    };

    loadWidgetConfig();
  }, [currentAgent?.id]);

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
      logger.error(`Failed to update ${name}:`, error);
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

  const handleDeleteArticle = (articleId: string) => {
    setPendingDeletions((prev) => [...prev, articleId]);
    markFieldDirty("settings", "knowledgeBase");
  };

  // Handle widget configuration changes
  const handleWidgetConfigChange = (newConfig: WidgetBuilderConfiguration) => {
    setWidgetConfig(newConfig);
    setDirtyFields((prev) => ({ ...prev, widgetConfig: true }));
  };

  // Save widget configuration
  const handleSaveWidgetConfig = async () => {
    if (!currentAgent || !widgetConfig) return;

    try {
      const response = await fetch(
        `/api/agents/${currentAgent.id}/widget-config`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ config: widgetConfig }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed with status: ${response.status}`
        );
      }

      // Reset dirty flag
      setDirtyFields((prev) => ({ ...prev, widgetConfig: false }));
    } catch (error) {
      console.error("Error saving widget configuration:", error);
      toast({
        title: "Error",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Failed to save widget configuration",
        variant: "destructive",
      });
    }
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
      if (dirtyFields.instructions)
        updates.instructions = currentAgent.instructions;
      if (dirtyFields.initiateConversation)
        updates.initiateConversation = currentAgent.initiateConversation;
      if (Object.values(dirtyFields.settings).some((v) => v))
        updates.settings = currentAgent.settings;
      if (dirtyFields.tools) updates.tools = currentAgent.tools;
      if (dirtyFields.toolLogic) updates.toolLogic = currentAgent.toolLogic;

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
            // Handle deletions first
            for (const articleId of pendingDeletions) {
              await deleteArticle(articleId);
            }

            // Handle new articles
            let newArticles: KnowledgeBaseDBArticle[] = [];
            if (pendingKnowledgeBaseArticles.length > 0) {
              newArticles = await createArticles(
                currentAgent.id,
                pendingKnowledgeBaseArticles
              );
            }

            // Update agent settings with filtered articles
            const updatedKnowledgeBase = [
              ...(currentAgent.settings?.knowledgeBase || []).filter(
                (article: KnowledgeBaseDBArticle) =>
                  !pendingDeletions.includes(article.id)
              ),
              ...newArticles.map((article) => ({
                id: article.id,
                title: article.title,
                updatedAt: article.updatedAt,
              })),
            ];

            await updateAgent(currentAgent.id, {
              settings: {
                ...currentAgent.settings,
                knowledgeBase: updatedKnowledgeBase,
              },
            });

            setPendingKnowledgeBaseArticles([]);
            setPendingDeletions([]);
          },
          name: "knowledge base",
        },
        // MCP servers update - update mcp server database  and agent
        {
          condition: dirtyFields.settings.mcpServers,
          handler: async () => {
            // Validate required environment variables
            const newInvalidFields: Record<string, string[]> = {};
            let hasInvalidFields = false;

            for (const server of mcpServers) {
              const definition = AVAILABLE_MCP_SERVERS[server.name];
              if (!definition) continue;

              const missingRequiredVars = definition.envVars
                ?.filter((envVar) => envVar.required)
                .filter((envVar) => !server.env[envVar.name]);

              if (missingRequiredVars && missingRequiredVars.length > 0) {
                newInvalidFields[server.name] = missingRequiredVars.map(
                  (v) => v.name
                );
                hasInvalidFields = true;
              }
            }

            if (hasInvalidFields) {
              setInvalidFields(newInvalidFields);
              // Don't throw error, just return early
              return;
            }

            // Get list of removed servers
            const existingServerNames = currentAgent.settings?.mcpServers || [];
            const removedServers = existingServerNames.filter(
              (name: string) => !mcpServers.some((s) => s.name === name)
            );

            // Delete removed servers
            for (const serverName of removedServers) {
              await deleteMcpServer(currentAgent.id, serverName);
            }

            // Save each MCP server to database
            for (const server of mcpServers) {
              await saveMcpServer(currentAgent.id, server);
            }

            // Update agent settings with just the list of server names
            await updateAgent(currentAgent.id, {
              settings: {
                ...currentAgent.settings,
                mcpServers: mcpServers.map((s) => s.name),
              },
            });

            // Clear invalid fields on success
            setInvalidFields({});
          },
          name: "integrations",
        },
        // Add widget configuration update
        {
          condition: dirtyFields.widgetConfig,
          handler: handleSaveWidgetConfig,
          name: "widget configuration",
        },
      ];

      // Execute all async updates in parallel
      await Promise.all(
        asyncUpdates.map((update) => handleAsyncUpdate(update))
      );

      // Only show success toast if there are no invalid fields
      if (Object.keys(invalidFields).length === 0) {
        toast({
          title: `${currentAgent.name} Updated`,
          description: "Your agent is deployed and ready to go!",
        });
        resetDirtyFields();
      } else {
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: "Please fill in all required fields before saving.",
        });
      }
    } catch (error) {
      logger.error("Failed to update agent:", error);
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
    window.open(`/agents/${agentId}/talk`, "_blank");
  };

  const handleDeleteAgent = useCallback(async () => {
    if (isUpdating) return; // Prevent multiple rapid deletions

    try {
      setIsUpdating(true);
      await deleteAgent(agentId);

      // Find next available agent or default to main agents page
      const remainingAgents = agents.filter((a) => a.id !== agentId);
      const nextAgent = remainingAgents[0];

      // Use client-side navigation without full page refresh
      const nextUrl = nextAgent ? `/agents/${nextAgent.id}` : "/agents";
      window.history.pushState({}, "", nextUrl);

      // Still need to use router.push for actual navigation
      router.push(nextUrl);
    } catch (error) {
      logger.error("Failed to delete agent:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete agent. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [agentId, agents, deleteAgent, isUpdating, router, toast]);

  if (loading) {
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
  }

  // If we have agents but the current agent isn't found, show a loading state
  // This helps with the initial load when agents exist but currentAgent isn't set yet
  if (agents.length > 0 && !currentAgent) {
    logger.info("Showing loading state for agent:", agentId);
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
  }

  if (!currentAgent) {
    logger.warn("No current agent found for ID:", agentId);
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {currentAgent.name}
          </h1>
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    onClick={handleCopy}
                  >
                    Embed Code
                    {copied ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} className="text-gray-500" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Copy and add this code to your website to embed{" "}
                  {currentAgent.name} agent
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || (!hasChanges && !hasInvalidFields)}
          >
            Save
          </Button>
          <Button
            variant="outline"
            onClick={handleTestClick}
            disabled={isUpdatingAgent}
          >
            {isUpdatingAgent ? "Deploying Agent..." : "Test Agent"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  agent and all its associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAgent}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card className="overflow-hidden border border-border/40 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 bg-muted/20">
              <CardTitle className="text-base">Task Description</CardTitle>
              <CardDescription className="text-xs">
                The description is used to build the instructions and the
                step-by-step flow for the agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3">
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
                className="min-h-[100px] resize-none focus-visible:ring-1 text-sm"
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-border/40 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 bg-muted/20">
              <CardTitle className="text-base">Personality</CardTitle>
              <CardDescription className="text-xs">
                Setup the agent&apos;s tone, demeanor, and other personality
                traits.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3">
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
                className="h-9 text-sm"
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-border/40 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 bg-muted/20">
              <CardTitle className="text-base">Knowledge Base</CardTitle>
              <CardDescription className="text-xs">
                Manage information that further personalizes your agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <KnowledgeBaseEditor
                onArticleChange={handleKnowledgeBaseArticle}
                onDeleteArticle={handleDeleteArticle}
                pendingArticles={pendingKnowledgeBaseArticles}
                pendingDeletions={pendingDeletions}
                existingArticles={existingArticles}
                isLoading={loadingArticles}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-border/40 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 bg-muted/20">
              <CardTitle className="text-base">Settings</CardTitle>
              <CardDescription className="text-xs">
                Customize the agent&apos;s behavior and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <Label
                    htmlFor="agentType"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Use Advanced Model
                    <span className="ml-1 text-xs text-muted-foreground">
                      (5x pricing)
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable more powerful AI capabilities
                    </p>
                  </Label>
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
                </div>

                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <Label
                    htmlFor="initiate"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Auto-initiate conversation
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Agent will start the conversation automatically
                    </p>
                  </Label>
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
                </div>

                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <Label
                    htmlFor="useBrowserTools"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Use browser tools
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Allow agent to access browser tools (clipboard, popups)
                    </p>
                  </Label>
                  <Switch
                    id="useBrowserTools"
                    checked={currentAgent.settings?.useBrowserTools}
                    onCheckedChange={(checked) =>
                      handleSettingChange("useBrowserTools", checked)
                    }
                  />
                </div>

                {/* <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <Label
                    htmlFor="isFormAgent"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Form Processing Agent
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable form processing capabilities
                    </p>
                  </Label>
                  <Switch
                    id="isFormAgent"
                    checked={currentAgent.settings?.isFormAgent}
                    onCheckedChange={(checked) =>
                      handleSettingChange("isFormAgent", checked)
                    }
                  />
                </div> */}

                {currentAgent.settings?.isFormAgent && (
                  <div className="mt-1 p-3 pl-4 border-l-2 border-primary/20 bg-muted/10 rounded-sm space-y-2">
                    <Label htmlFor="formUrl" className="text-xs font-medium">
                      Google Form URL
                    </Label>
                    <Input
                      id="formUrl"
                      type="url"
                      placeholder="Enter Google Form URL"
                      value={currentAgent.settings?.formSchema?.url || ""}
                      className="h-8 text-sm"
                      onChange={(e) =>
                        handleSettingChange("formSchema", {
                          // if url is changed, everything in the schema is invalidated
                          url: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-4">
            {/* Integration cards section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mcpServers.map((server) => {
                const definition = AVAILABLE_MCP_SERVERS[server.name];
                if (!definition) return null;

                return (
                  <Card
                    key={server.name}
                    className="overflow-hidden border border-border/40 shadow-sm hover:shadow transition-shadow"
                  >
                    <CardHeader className="p-4 pb-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                            <span className="text-xl">{definition.icon}</span>
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {definition.displayName}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-1">
                              {definition.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setMcpServers(
                              mcpServers.filter((s) => s.name !== server.name)
                            );
                            markFieldDirty("settings", "mcpServers");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-3 space-y-3">
                      {definition.envVars?.map((envVar) => (
                        <div key={envVar.name} className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <Label
                              htmlFor={envVar.name}
                              className="text-xs font-medium"
                            >
                              {envVar.name}
                              {envVar.required && (
                                <span className="text-red-500 ml-0.5">*</span>
                              )}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                  >
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">
                                    Please verify this value is correct before
                                    saving. Credentials are stored securely in a
                                    key vault.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id={envVar.name}
                            type="password"
                            placeholder={envVar.description}
                            value={
                              server.env[envVar.name] || envVar.default || ""
                            }
                            className={`h-8 text-sm ${
                              invalidFields[server.name]?.includes(envVar.name)
                                ? "border-red-500 focus-visible:ring-red-500"
                                : ""
                            }`}
                            onChange={(e) => {
                              const updatedServers = mcpServers.map((s) =>
                                s.name === server.name
                                  ? {
                                      ...s,
                                      env: {
                                        ...s.env,
                                        [envVar.name]: e.target.value,
                                      },
                                    }
                                  : s
                              );
                              setMcpServers(updatedServers);
                              markFieldDirty("settings", "mcpServers");

                              // Clear invalid state for this field when user types
                              if (
                                invalidFields[server.name]?.includes(
                                  envVar.name
                                )
                              ) {
                                setInvalidFields((prev) => ({
                                  ...prev,
                                  [server.name]: prev[server.name].filter(
                                    (v) => v !== envVar.name
                                  ),
                                }));
                              }
                            }}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Add Integration button and dialog */}
            <Dialog
              open={integrationDialogOpen}
              onOpenChange={setIntegrationDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="mt-2 flex items-center justify-center gap-2 h-10 w-full max-w-xs mx-auto border-dashed border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Integration</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Integrations</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                  {Object.entries(AVAILABLE_MCP_SERVERS).map(
                    ([name, server]) => {
                      const isSelected = pendingMcpServers.some(
                        (s) => s.name === name
                      );
                      const isDisabled =
                        mcpServers.some((s) => s.name === name) && !isSelected;

                      return (
                        <div
                          key={name}
                          className={`flex items-center space-x-4 p-3 rounded-lg border border-border/40 ${
                            isSelected
                              ? "bg-primary/5 border-primary/30"
                              : isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-muted/30"
                          } transition-colors`}
                        >
                          <Checkbox
                            id={name}
                            checked={isSelected}
                            disabled={isDisabled}
                            className={
                              isSelected ? "text-primary border-primary" : ""
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setPendingMcpServers([
                                  ...pendingMcpServers,
                                  { name, env: {} },
                                ]);
                              } else {
                                setPendingMcpServers(
                                  pendingMcpServers.filter(
                                    (s) => s.name !== name
                                  )
                                );
                              }
                              markFieldDirty("settings", "mcpServers");
                            }}
                          />
                          <label
                            htmlFor={name}
                            className={`flex items-center gap-3 text-sm leading-none cursor-pointer flex-1 ${
                              isDisabled ? "cursor-not-allowed" : ""
                            }`}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                              <span className="text-lg">{server.icon}</span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {server.displayName}
                              </p>
                              <p className="text-muted-foreground text-xs mt-1">
                                {server.description}
                              </p>
                            </div>
                          </label>
                        </div>
                      );
                    }
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setMcpServers(pendingMcpServers);
                      setIntegrationDialogOpen(false);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Add Selected
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="widget" className="space-y-6">
          {isWidgetConfigLoading ? (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-32 w-32 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Loading widget configuration...
                </p>
              </div>
            </Card>
          ) : (
            <Widget
              agent={currentAgent}
              widgetConfig={widgetConfig || {}}
              onConfigChange={handleWidgetConfigChange}
            />
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="overflow-hidden border border-border/40 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 bg-muted/20">
              <CardTitle className="text-base">Instruction</CardTitle>
              <CardDescription className="text-xs">
                The instruction that is passed to the agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <Textarea
                value={currentAgent.instructions || ""}
                onChange={(e) => {
                  setCurrentAgent({
                    ...currentAgent,
                    instructions: e.target.value,
                  });
                  markFieldDirty("instructions");
                }}
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-border/40 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="p-4 pb-2 bg-muted/20">
              <CardTitle className="text-base">Tools</CardTitle>
              <CardDescription className="text-xs">
                Define the functions (tools) available to the agent. Each tool
                should have a unique name, a description, and a JSON schema for
                parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <div className="space-y-4">
                {currentAgent.tools?.map((tool, index) => {
                  // Validation helpers
                  const nameError = !tool.name
                    ? "Name is required"
                    : currentAgent.tools?.some(
                        (t, i) => t.name === tool.name && i !== index
                      )
                    ? "Name must be unique"
                    : null;
                  let paramsError = null;
                  try {
                    if (
                      tool.parameters &&
                      typeof tool.parameters !== "object"
                    ) {
                      throw new Error();
                    }
                    JSON.stringify(tool.parameters || {});
                  } catch {
                    paramsError = "Parameters must be valid JSON";
                  }
                  // Tool logic association
                  const logicValue = currentAgent.toolLogic?.[tool.name] || "";
                  return (
                    <div
                      key={tool.name + index}
                      className="border border-border/40 rounded-md p-4 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-2 flex-1">
                          <Label className="text-xs mb-1">Name</Label>
                          <Input
                            className={`text-sm ${
                              nameError
                                ? "border-red-500 focus-visible:ring-red-500"
                                : ""
                            }`}
                            value={tool.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              // Update tool name and toolLogic key if needed
                              const updatedTools = [
                                ...(currentAgent.tools || []),
                              ];
                              const oldName = tool.name;
                              updatedTools[index] = { ...tool, name: newName };
                              const updatedToolLogic = {
                                ...currentAgent.toolLogic,
                              };
                              if (
                                oldName &&
                                oldName !== newName &&
                                updatedToolLogic[oldName]
                              ) {
                                updatedToolLogic[newName] =
                                  updatedToolLogic[oldName];
                                delete updatedToolLogic[oldName];
                              }
                              setCurrentAgent({
                                ...currentAgent,
                                tools: updatedTools,
                                toolLogic: updatedToolLogic,
                              });
                              markFieldDirty("tools");
                              markFieldDirty("toolLogic");
                            }}
                          />
                          {nameError && (
                            <span className="text-xs text-red-500">
                              {nameError}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 mt-6"
                          onClick={() => {
                            // Remove tool and its logic
                            const updatedTools = [
                              ...(currentAgent.tools || []),
                            ];
                            const removedTool = updatedTools.splice(
                              index,
                              1
                            )[0];
                            const updatedToolLogic = {
                              ...currentAgent.toolLogic,
                            };
                            if (
                              removedTool &&
                              updatedToolLogic[removedTool.name]
                            ) {
                              delete updatedToolLogic[removedTool.name];
                            }
                            setCurrentAgent({
                              ...currentAgent,
                              tools: updatedTools,
                              toolLogic: updatedToolLogic,
                            });
                            markFieldDirty("tools");
                            markFieldDirty("toolLogic");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <Label className="text-xs mb-1">Description</Label>
                        <Textarea
                          className="text-xs"
                          value={tool.description}
                          onChange={(e) => {
                            const updatedTools = [
                              ...(currentAgent.tools || []),
                            ];
                            updatedTools[index] = {
                              ...tool,
                              description: e.target.value,
                            };
                            setCurrentAgent({
                              ...currentAgent,
                              tools: updatedTools,
                            });
                            markFieldDirty("tools");
                          }}
                        />
                      </div>
                      <div className="mt-2">
                        <Label className="text-xs mb-1">
                          Parameters (JSON Schema)
                        </Label>
                        <Textarea
                          className={`font-mono text-xs h-32 ${
                            paramsError
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }`}
                          value={
                            typeof tool.parameters === "string"
                              ? tool.parameters
                              : JSON.stringify(tool.parameters || {}, null, 2)
                          }
                          onChange={(e) => {
                            let parsedParams = tool.parameters;
                            try {
                              const candidate = JSON.parse(e.target.value);
                              if (
                                typeof candidate === "object" &&
                                candidate !== null &&
                                typeof candidate.type === "string" &&
                                typeof candidate.properties === "object"
                              ) {
                                parsedParams = candidate;
                                paramsError = null;
                              } else {
                                paramsError =
                                  "Parameters must include 'type' and 'properties' fields";
                              }
                            } catch {
                              paramsError = "Parameters must be valid JSON";
                            }
                            const updatedTools = [
                              ...(currentAgent.tools || []),
                            ];
                            updatedTools[index] = {
                              ...tool,
                              parameters: parsedParams,
                            };
                            setCurrentAgent({
                              ...currentAgent,
                              tools: updatedTools,
                            });
                            markFieldDirty("tools");
                          }}
                        />
                        {paramsError && (
                          <span className="text-xs text-red-500">
                            {paramsError}
                          </span>
                        )}
                      </div>
                      <details className="mt-4">
                        <summary className="cursor-pointer text-xs font-semibold text-primary">
                          Edit Tool Logic
                        </summary>
                        <div className="mt-2">
                          <Label className="text-xs mb-1">
                            Logic (TypeScript)
                          </Label>
                          <Textarea
                            className="font-mono text-xs h-48"
                            value={logicValue}
                            onChange={(e) => {
                              const updatedToolLogic = {
                                ...currentAgent.toolLogic,
                                [tool.name]: e.target.value,
                              };
                              setCurrentAgent({
                                ...currentAgent,
                                toolLogic: updatedToolLogic,
                              });
                              markFieldDirty("toolLogic");
                            }}
                          />
                        </div>
                      </details>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  className="mt-2 w-full flex items-center gap-2"
                  onClick={() => setAddToolDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add New Tool
                </Button>
                <ToolDialog
                  open={addToolDialogOpen}
                  onOpenChange={setAddToolDialogOpen}
                  onAddTool={(tool: {
                    name: string;
                    description: string;
                    parameters: object;
                  }) => {
                    const newTool: Tool = {
                      type: "function",
                      name: tool.name,
                      description: tool.description,
                      parameters: tool.parameters as any, // ToolParameters type, but safe from dialog
                    };
                    setCurrentAgent((prev) =>
                      prev
                        ? {
                            ...prev,
                            tools: [...(prev.tools || []), newTool],
                          }
                        : prev
                    );
                    markFieldDirty("tools");
                  }}
                  existingToolNames={
                    currentAgent.tools?.map((t) => t.name) || []
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
