import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

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
    const agent = result.rows[0];
    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      instructions: agent.instructions,
      seed: agent.seed,
      createdAt: new Date(agent.created_at).toISOString(),
    });
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the agent" },
      { status: 500 }
    );
  }
}
