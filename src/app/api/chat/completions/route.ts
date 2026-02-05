import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Chat Completions API");

const openai = new OpenAI();
const DEFAULT_MODEL = "gpt-5-mini-2025-08-07";

const normalizeContentPart = (part: any) => {
  if (typeof part === "string") {
    return { type: "input_text", text: part };
  }
  if (!part || typeof part !== "object") {
    return part;
  }

  if (part.type === "input_text" || part.type === "input_image" || part.type === "input_file") {
    return part;
  }

  if (part.type === "text") {
    return { type: "input_text", text: part.text ?? "" };
  }

  if (part.type === "image_url") {
    const imageUrl =
      typeof part.image_url === "string" ? part.image_url : part.image_url?.url;
    return { type: "input_image", image_url: imageUrl };
  }

  return part;
};

const normalizeMessageToInput = (message: any) => {
  const role = message?.role === "system" ? "developer" : message?.role;
  const content =
    Array.isArray(message?.content) && message.content.length > 0
      ? message.content.map(normalizeContentPart)
      : [
          {
            type: "input_text",
            text: message?.content ?? "",
          },
        ];

  return { role, content };
};

const normalizeInput = (input: any) => {
  if (typeof input === "string") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => {
      if (item && typeof item === "object" && "role" in item) {
        return normalizeMessageToInput(item);
      }
      return item;
    });
  }
  return input;
};

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
      input !== undefined
        ? normalizeInput(input)
        : Array.isArray(messages)
          ? messages.map(normalizeMessageToInput)
          : "";

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
