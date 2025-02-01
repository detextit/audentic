import { getUserAgents } from "@/db";
import { AgentConfig } from "@audentic/react";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  console.log("sessions");
  try {
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const agents = await getUserAgents(userId);
    if (agents.length > 0) {
      const agentIds = agents.map((agent: AgentConfig) => agent.id);
      const agentIdsQuoted = agentIds.map((id) => `'${id}'`).join(",");
      const query = `
        SELECT * FROM sessions WHERE agent_id IN (${agentIdsQuoted})
        ORDER BY started_at DESC
      `;
      const result = await sql.query(query);
      return NextResponse.json(result.rows);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

//Add a get call to get all the sessions for a list of agents, use api/agents to
// get all agents for the user.
