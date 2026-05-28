import { NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  getAgentById,
  getAgentKnowledgeBase,
  getUserBudget,
} from "@/db";
import { injectBrowserTools } from "@/agentBuilder/browserUtils";
import { injectBrowserActions } from "@/agentBuilder/browserActions";
import { AgentConfig, AgentDBConfig } from "@/types/agent";
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
import { createLogger } from "@/utils/logger";
import { UserBudget } from "@/types/budget";
import {
  REALTIME_MODEL,
  getAgentRealtimeModel,
  getRealtimeSessionSettings,
} from "@/lib/realtime";

const logger = createLogger("Token API");
const REALTIME_CLIENT_SECRET_TTL_SECONDS = 600;

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

    if (!apiKeyToUse) {
      logger.error("OpenAI API key missing for realtime client secret");
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500, headers: corsHeaders }
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
      getVoiceAgentDefaultInstructions(
        agentConfig.name,
        new Date().toDateString()
      ) +
      "\n#Agent Instruction\n" +
      agentConfig.instructions;

    const tools = [...(agentConfig.tools || [])];

    const agentConfigForClient: AgentConfig = {
      ...agentConfig,
      instructions,
      tools,
      model: REALTIME_MODEL,
      realtime: getRealtimeSessionSettings(),
    };

    const sessionConfig = {
      expires_after: {
        anchor: "created_at",
        seconds: REALTIME_CLIENT_SECRET_TTL_SECONDS,
      },
      session: {
        type: "realtime",
        model: agentConfigForClient.model,
        output_modalities: ["audio"],
        audio: {
          input: {
            transcription:
              agentConfigForClient.realtime?.audio?.input?.transcription ??
              null,
            turn_detection:
              agentConfigForClient.realtime?.audio?.input?.turnDetection ??
              undefined,
            noise_reduction:
              agentConfigForClient.realtime?.audio?.input?.noiseReduction ??
              null,
          },
          output: agentConfigForClient.realtime?.audio?.output,
        },
        ...(agentConfigForClient.realtime?.reasoning
          ? { reasoning: agentConfigForClient.realtime.reasoning }
          : {}),
        ...(agentConfigForClient.realtime?.truncation
          ? { truncation: agentConfigForClient.realtime.truncation }
          : {}),
        ...(typeof agentConfigForClient.realtime?.parallelToolCalls ===
          "boolean"
          ? {
              parallel_tool_calls:
                agentConfigForClient.realtime.parallelToolCalls,
            }
          : {}),
        max_output_tokens:
          agentConfigForClient.realtime?.maxOutputTokens ?? 4096,
      },
    };
    const safetyIdentifier = createSafetyIdentifier(userBudget.userId);

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeyToUse}`,
          "Content-Type": "application/json",
          "OpenAI-Safety-Identifier": safetyIdentifier,
        },
        body: JSON.stringify(sessionConfig),
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
    const ephemeralKey = data?.value;
    if (!ephemeralKey) {
      logger.error("Client secret response missing value:", data);
      return NextResponse.json(
        { error: "Failed to create ephemeral key" },
        { status: 502, headers: corsHeaders }
      );
    }

    // convert tooLogic values to strings
    const toolLogic = agentConfig.toolLogic || {};

    const tokenResponse = {
      ephemeral_key: ephemeralKey,
      agent_config: agentConfigForClient,
      tool_logic: toolLogic,
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
      model: getAgentRealtimeModel(),
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

function createSafetyIdentifier(userId: string) {
  return createHash("sha256")
    .update(`audentic:${userId}`)
    .digest("hex")
    .slice(0, 64);
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

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return value.trim();
  }
};

const isOriginAllowed = (origin: string, allowedOrigins: string) => {
  const normalizedOrigin = normalizeOrigin(origin);
  const allowedList = allowedOrigins
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  return allowedList.includes(normalizedOrigin);
};

// Enhance the verifyApiKey function to check both API key and origin if needed
async function verifyApiKey(
  origin: string | null,
  apiKey: string | null
): Promise<boolean> {
  if (!apiKey) return false;

  try {
    const agent = await getAgentById(apiKey);

    if (!agent) {
      logger.warn("Invalid API key", apiKey);
      return false;
    }

    if (origin && agent.webUI) {
      const allowed = isOriginAllowed(origin, agent.webUI);
      if (!allowed) {
        logger.warn("Origin not allowed", { origin, allowed: agent.webUI });
      }
      return allowed;
    }

    return true;
  } catch (error) {
    logger.error("API key verification error:", error);
    return false;
  }
}
