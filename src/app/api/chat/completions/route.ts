import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Chat Completions API");

const openai = new OpenAI();
const DEFAULT_MODEL = "gpt-4.1-mini";

const normalizeMessagesToInput = (messages: any[]) =>
  messages.map((message) => {
    const content =
      Array.isArray(message.content) && message.content.length > 0
        ? message.content
        : [
            {
              type: "input_text",
              text: message.content ?? "",
            },
          ];

    return {
      role: message.role,
      content,
      type: "message",
    };
  });

export const maxDuration = 30; // This is the time in seconds that this function is allowed to execute within. Setting it to 30s.
export async function POST(req: Request) {
  try {
    const request = await req.json();
    const {
      messages,
      input,
      model,
      temperature,
      max_tokens,
      max_output_tokens,
    } = request ?? {};

    const responseInput =
      input ?? (Array.isArray(messages) ? normalizeMessagesToInput(messages) : "");

    const response = await openai.responses.create({
      model: model ?? DEFAULT_MODEL,
      input: responseInput,
      temperature: temperature ?? 0,
      max_output_tokens: max_output_tokens ?? max_tokens ?? 2048,
    });

    return NextResponse.json({
      output_text: response.output_text,
      response,
    });
  } catch (error: any) {
    logger.error("Error in /chat/completions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
