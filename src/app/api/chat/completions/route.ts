import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export const maxDuration = 30; // This is the time in seconds that this function is allowed to execute within. Setting it to 30s.
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0,
      max_tokens: 1024,
    });

    return NextResponse.json(completion);
  } catch (error: any) {
    console.error("Error in /chat/completions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
