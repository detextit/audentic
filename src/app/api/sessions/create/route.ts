import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { sessionId, agentId } = await request.json();

    await sql`
      INSERT INTO sessions (session_id, agent_id)
      VALUES (${sessionId}, ${agentId})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
