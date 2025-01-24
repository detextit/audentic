import { NextResponse } from "next/server";
import { allAgentSets } from "@/agentConfigs";

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

// Add this to handle OPTIONS preflight requests
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("Origin");
  const apiKey = request.headers.get("X-API-Key");

  // Verify API key for OPTIONS request
  const isValidApiKey = await verifyApiKey(origin, apiKey);
  const corsHeaders = getCorsHeaders(isValidApiKey);

  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("Origin");
    const apiKey = request.headers.get("X-API-Key");

    // Verify API key and get CORS headers
    const isValidApiKey = await verifyApiKey(origin, apiKey);
    const corsHeaders = getCorsHeaders(isValidApiKey);

    if (!isValidApiKey || !corsHeaders) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: getCorsHeaders(false) || {}, // Always return CORS headers for error responses
        }
      );
    }
    if (!apiKey || !allAgentSets[apiKey]) {
      return NextResponse.json(
        { error: "Invalid API key" },
        {
          status: 401,
          headers: getCorsHeaders(false) || {},
        }
      );
    }
    const agentConfig = allAgentSets[apiKey][0];
    const instructions =
      agentConfig.instructions ||
      "You are a helpful assistant." +
        (agentConfig.firstMessage
          ? `\n\nInitiate the conversation with: ${agentConfig.firstMessage}`
          : "");

    const sessionSettings = {
      model: "gpt-4o-mini-realtime-preview",
      modalities: ["text", "audio"],
      instructions: instructions,
      voice: "alloy",
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1",
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
        create_response: true,
      },
      temperature: 0.6,
      tools: agentConfig.tools || [],
    };
    // console.log("sessionSettings", sessionSettings);

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
    // console.log("response", response);
    if (!response.ok) {
      const error = await response.text();
      console.error("Token fetch error:", error);
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    console.log("Token data:", data);
    const tokenResponse = {
      client_secret: data.client_secret,
      session_id: data.id,
      initiate_conversation: agentConfig.firstMessage ? true : false,
      url: "https://api.openai.com/v1/realtime",
      eventChannel: "oai-events",
      tool_logic: agentConfig.toolLogic ? agentConfig.toolLogic : {},
    };
    return NextResponse.json(tokenResponse, { status: 200 });
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

// Enhance the verifyApiKey function to check both API key and origin if needed
async function verifyApiKey(
  origin: string | null,
  apiKey: string | null
): Promise<boolean> {
  if (!apiKey && !origin) return false;

  try {
    console.log(origin, apiKey);
    return true; // Replace with actual verification
  } catch (error) {
    console.error("API key verification error:", error);
    return false;
  }
}
