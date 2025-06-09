import { NextResponse } from "next/server";
import {
  getAgentById,
  getAgentKnowledgeBase,
  getMcpServers,
  getUserBudget,
} from "@/db";
import { injectBrowserTools } from "@/agentBuilder/browserUtils";
import { injectBrowserActions } from "@/agentBuilder/browserActions";
import { AgentConfig, AgentDBConfig, Tool } from "@/types/agent";
import {
  createFormToolLogic,
  FormToolState,
  injectFormTools,
  createFormFieldEnum,
} from "@/agentBuilder/formUtils";
import { injectCallTools } from "@/agentBuilder/callUtils";
import {
  formAgentMetaPrompt,
  getVoiceAgentDefaultInstructions,
} from "@/agentBuilder/metaPrompts";
import { configureServers, listTools } from "@/mcp/mcpUtils";
import { AVAILABLE_MCP_SERVERS } from "@/mcp/servers";
import { createLogger } from "@/utils/logger";
import { UserBudget } from "@/types/budget";

const logger = createLogger("Token API");

const getCorsHeaders = (isAllowed: boolean) => {
  if (isAllowed) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    };
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("Origin");
    const apiKey = request.headers.get("X-API-Key");

    // Verify API key and get CORS headers
    const isValidApiKey = await verifyApiKey(origin, apiKey);
    const corsHeaders = getCorsHeaders(isValidApiKey);

    if (!apiKey || !isValidApiKey || !corsHeaders) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: getCorsHeaders(false) || {}, // Always return CORS headers for error responses
        }
      );
    }

    // Get agent config from allAgentSets
    const { agentConfig, userBudget } = await getAgentConfig(apiKey);

    if (!agentConfig || !userBudget) {
      return NextResponse.json(
        { error: "Agent configuration cannot be retrieved" },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }
    // Check if user has enough budget (require $1 per session)
    const hasEnough = await hasEnoughBudget(userBudget, 1);

    if (!hasEnough) {
      logger.error(
        `Insufficient budget for agent ${agentConfig.name}, budget: ${userBudget}`
      );
      return NextResponse.json(
        { error: "Insufficient budget" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const apiKeyToUse =
      userBudget.planType === "byok"
        ? userBudget.openaiApiKey
        : process.env.OPENAI_API_KEY;

    // Fetch knowledge base articles
    const knowledgeBase = await getAgentKnowledgeBase(apiKey);

    // Prepare knowledge base content for instructions
    let knowledgeBaseContent = "";
    if (knowledgeBase.length > 0) {
      knowledgeBaseContent =
        "\n# Knowledge Base\n" +
        knowledgeBase
          .map((article) => `## ${article.title}\n${article.content}`)
          .join("\n");
    }

    // Combine base instructions with knowledge base content
    const instructions =
      knowledgeBaseContent +
      "\n" +
      getVoiceAgentDefaultInstructions(
        agentConfig.name,
        new Date().toDateString()
      ) +
      "\n#Agent Instruction\n" +
      agentConfig.instructions;

    const tools = agentConfig.tools || [];
    const mcpTools: Record<string, string[]> = {};
    const mcpBaseUrl = process.env.MCP_SERVER_URL; // TODO: make this unique per agent with secure token

    if (userBudget.planType !== "byok") {
      // BYOK users do not have MCP server support

      logger.debug("MCP base URL:", mcpBaseUrl);
      // get MCP servers
      const mcpServers = await getMcpServers(apiKey);
      if (mcpServers.length > 0) {
        // Configure MCP servers and get tools
        const mcpServerConfig: Record<string, any> = {};
        const configuredServerNames: string[] = [];

        for (const server of mcpServers) {
          if (AVAILABLE_MCP_SERVERS[server.name]) {
            // Create a deep copy of the defaultEnv to avoid modifying the original
            const defaultEnv = {
              ...AVAILABLE_MCP_SERVERS[server.name].defaultEnv,
            };

            // Customize MEMORY_FILE_PATH if it exists
            if (defaultEnv?.MEMORY_FILE_PATH) {
              defaultEnv.MEMORY_FILE_PATH = defaultEnv.MEMORY_FILE_PATH.replace(
                "${agentId}",
                apiKey
              );
            }

            mcpServerConfig[server.name] = {
              command: AVAILABLE_MCP_SERVERS[server.name].command,
              env: {
                ...server.env,
                ...defaultEnv,
              },
              args: AVAILABLE_MCP_SERVERS[server.name].args,
            };
            configuredServerNames.push(server.name);
          } else {
            logger.error(`MCP server ${server.name} not found`);
          }
        }

        // Configure servers and get available tools
        const result = await configureServers(mcpServerConfig);
        logger.info("MCP servers configured:", result);

        // Get tools from each configured server
        for (const serverName of configuredServerNames) {
          const serverTools: Tool[] = await listTools(serverName);
          tools.push(...serverTools);
          mcpTools[serverName] = serverTools.map((tool) => tool.name);
        }
      }
    }

    const sessionSettings = {
      model: agentConfig.model,
      modalities: ["text", "audio"],
      instructions,
      voice: "alloy",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1",
      },
      turn_detection: {
        type: "semantic_vad",
        eagerness: "auto",
        interrupt_response: true,
        create_response: true,
      },
      input_audio_noise_reduction: { type: "far_field" },
      temperature: 0.6,
      tools,
      tool_choice: "auto",
    };

    logger.info("Session settings:", JSON.stringify(sessionSettings, null, 2));

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeyToUse}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionSettings),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error("Token fetch error:", error);

      // If using user's API key and there's an error, it might be an invalid or expired key
      if (userBudget.planType === "byok" && userBudget.openaiApiKey) {
        return NextResponse.json(
          {
            error:
              "Your OpenAI API key seems to be invalid or expired. Please update your API key in settings.",
            code: "invalid_api_key",
          },
          {
            status: 401,
            headers: corsHeaders,
          }
        );
      }

      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    // convert tooLogic values to strings
    const toolLogic = agentConfig.toolLogic || {};

    logger.info("Tool logic:", JSON.stringify(toolLogic, null, 2));

    const tokenResponse = {
      client_secret: data.client_secret,
      session_id: data.id,
      initiate_conversation: agentConfig.initiateConversation,
      url: "https://api.openai.com/v1/realtime",
      eventChannel: "oai-events",
      tool_logic: toolLogic,
      mcp_tools: mcpTools,
      mcp_base_url: mcpBaseUrl,
    };

    return NextResponse.json(tokenResponse, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    logger.error("Token route error:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
      {
        status: 500,
        headers: getCorsHeaders(false) || {},
      }
    );
  }
}

// Function to get agent config using the agents API
async function getAgentConfig(
  agentId: string
): Promise<{ agentConfig: AgentConfig | null; userBudget: UserBudget | null }> {
  try {
    const agent: AgentDBConfig | null = await getAgentById(agentId);
    if (!agent || !agent.userId) {
      return { agentConfig: null, userBudget: null };
    }

    const userBudget = await getUserBudget(agent.userId);
    if (!userBudget) {
      return { agentConfig: null, userBudget: null };
    }

    let agentConfig: AgentConfig = {
      name: agent.name,
      model: agent.settings?.isAdvancedModel
        ? "gpt-4o-realtime-preview-2025-06-03"
        : "gpt-4o-mini-realtime-preview",
      initiateConversation: agent.initiateConversation,
      instructions: agent.instructions,
      tools: agent.tools,
      toolLogic: agent.toolLogic,
    } as AgentConfig;

    agentConfig = injectCallTools(agentConfig);
    // Add browser tools if enabled
    if (agent.settings?.useBrowserTools) {
      agentConfig = injectBrowserActions(
        injectBrowserTools(agentConfig, "all"),
        "minimal"
      );
    }

    // Add form tools if form data exists
    if (agent.settings?.isFormAgent) {
      agentConfig.instructions =
        formAgentMetaPrompt + "\n" + agentConfig.instructions;
      const formFields = createFormFieldEnum(
        agent.settings.formSchema.formItems
      );
      agentConfig = injectFormTools(agentConfig, formFields);
      const formState: FormToolState = {
        formFields,
        formItems: agent.settings.formSchema.formItems,
        formState: {},
        zodSchema: agent.settings.formSchema.zodSchema,
      };
      const formToolLogic = createFormToolLogic(formState);
      logger.info("Form tool logic:", formToolLogic);
      // Merge the form tool logic with existing tool logic
      agentConfig.toolLogic = {
        ...agentConfig.toolLogic,
        ...formToolLogic,
      };
    }

    return { agentConfig, userBudget };
  } catch (error) {
    logger.error("Error fetching agent config:", error);
    return { agentConfig: null, userBudget: null };
  }
}

async function hasEnoughBudget(
  userBudget: UserBudget,
  estimatedCost: number = 0.01
): Promise<boolean> {
  try {
    if (userBudget.planType !== "byok") {
      return userBudget.totalBudget - userBudget.usedAmount >= estimatedCost;
    } else {
      return true;
    }
  } catch (error) {
    logger.error("Error checking budget:", error);
    return false;
  }
}

// Enhance the verifyApiKey function to check both API key and origin if needed
async function verifyApiKey(
  origin: string | null,
  apiKey: string | null
): Promise<boolean> {
  if (!apiKey && !origin) return false;

  try {
    logger.info("Verify API key", origin, apiKey);
    return true; // Replace with actual verification
  } catch (error) {
    logger.error("API key verification error:", error);
    return false;
  }
}
