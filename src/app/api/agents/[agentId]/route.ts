import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { AgentDBConfig } from "@/agentBuilder/types";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Agent ID API");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const result = await sql`
      SELECT 
        *
      FROM agents 
      WHERE id = ${agentId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const agent = result.rows[0] as AgentDBConfig;
    return NextResponse.json({
      ...agent,
    });
  } catch (error) {
    logger.error("Error fetching agent:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the agent" },
      { status: 500 }
    );
  }
}
