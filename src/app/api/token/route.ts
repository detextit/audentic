import { NextResponse } from "next/server";
import { getAgentById } from "@/db";
import { injectDefaultTools } from "@/agentBuilder/utils";
import { AgentConfig } from "@/agentBuilder/types";

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
    const agentConfigWithTools = injectDefaultTools(agentConfig);
    const instructions =
      agentConfigWithTools.instructions || "You are a helpful assistant.";

    const tools = agentConfigWithTools.tools || [];

    const sessionSettings = {
      model: "gpt-4o-realtime-preview",
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
    const toolLogic = agentConfig.toolLogic || {};

    console.log("Token data:", data);
    const tokenResponse = {
      client_secret: data.client_secret,
      session_id: data.id,
      initiate_conversation: agentConfig.initiateConversation,
      url: "https://api.openai.com/v1/realtime",
      eventChannel: "oai-events",
      tool_logic: toolLogic,
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
    const agent = await getAgentById(agentId);
    return agent;
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
