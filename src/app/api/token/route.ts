import { NextResponse } from "next/server";
import { getAgentById, getAgentKnowledgeBase, getMcpServers } from "@/db";
import { injectBrowserTools } from "@/agentBuilder/browserUtils";
import { injectBrowserActions } from "@/agentBuilder/browserActions";
import { AgentConfig, AgentDBConfig, Tool } from "@/agentBuilder/types";
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
    const agentConfig = await getAgentConfig(apiKey);

    if (!agentConfig) {
      return NextResponse.json(
        { error: "Agent configuration not found - Invalid Agent ID" },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

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
      agentConfig.instructions +
      "\n" +
      getVoiceAgentDefaultInstructions(
        agentConfig.name,
        new Date().toLocaleString()
      );

    const tools = agentConfig.tools || [];
    const mcpTools: Record<string, string[]> = {};
    const mcpBaseUrl = process.env.MCP_SERVER_URL; // TODO: make this unique per agent with secure token

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
          console.error(`MCP server ${server.name} not found`);
        }
      }

      // Configure servers and get available tools
      const result = await configureServers(mcpServerConfig);
      console.log("MCP servers configured:", result);

      // Get tools from each configured server
      for (const serverName of configuredServerNames) {
        const serverTools: Tool[] = await listTools(serverName);
        tools.push(...serverTools);
        mcpTools[serverName] = serverTools.map((tool) => tool.name);
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
        type: "server_vad",
        threshold: 0.6,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
        create_response: true,
      },
      temperature: 0.6,
      tools,
      tool_choice: "auto",
    };

    console.log("Session settings:", JSON.stringify(sessionSettings, null, 2));

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionSettings),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Token fetch error:", error);
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    // convert tooLogic values to strings
    const toolLogic = agentConfig.toolLogic || {};

    console.log("Tool logic:", JSON.stringify(toolLogic, null, 2));

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
    console.error("Token route error:", error);
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
async function getAgentConfig(agentId: string): Promise<AgentConfig | null> {
  try {
    const agent: AgentDBConfig | null = await getAgentById(agentId);
    if (agent) {
      let agentConfig: AgentConfig = {
        name: agent.name,
        model: agent.settings?.isAdvancedModel
          ? "gpt-4o-realtime-preview"
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
        console.log("Form tool logic:", formToolLogic);
        // Merge the form tool logic with existing tool logic
        agentConfig.toolLogic = {
          ...agentConfig.toolLogic,
          ...formToolLogic,
        };
      }

      return agentConfig;
    }
    return null;
  } catch (error) {
    console.error("Error fetching agent config:", error);
    return null;
  }
}

// Enhance the verifyApiKey function to check both API key and origin if needed
async function verifyApiKey(
  origin: string | null,
  apiKey: string | null
): Promise<boolean> {
  if (!apiKey && !origin) return false;

  try {
    console.log("Verify API key", origin, apiKey);
    return true; // Replace with actual verification
  } catch (error) {
    console.error("API key verification error:", error);
    return false;
  }
}
