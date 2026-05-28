import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Sessions CreateAPI");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { sessionId, agentId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400, headers: corsHeaders }
      );
    }

    await sql`
      INSERT INTO sessions (session_id, agent_id)
      VALUES (${sessionId}, ${agentId})
      ON CONFLICT (session_id)
      DO UPDATE SET
        agent_id = COALESCE(sessions.agent_id, EXCLUDED.agent_id)
    `;

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    logger.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500, headers: corsHeaders }
    );
  }
}
