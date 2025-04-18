import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Chat Completions API");

const openai = new OpenAI();

export const maxDuration = 30; // This is the time in seconds that this function is allowed to execute within. Setting it to 30s.
export async function POST(req: Request) {
  try {
    const request = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      temperature: 0,
      max_tokens: 2048,
      ...request,
    });

    return NextResponse.json(completion);
  } catch (error: any) {
    logger.error("Error in /chat/completions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
