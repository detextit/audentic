import { NextResponse } from "next/server";
import { createLogger } from "@/utils/logger";
import { getAgentById } from "@/db";
const logger = createLogger("Agent ID API");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const agent = await getAgentById(agentId);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
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
