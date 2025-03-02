import { NextResponse } from "next/server";
import { getMcpServers } from "@/db";
import { createLogger } from "@/utils/logger";

const logger = createLogger("MCP Servers API");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const mcpServers = await getMcpServers(agentId);
    return NextResponse.json(mcpServers);
  } catch (error) {
    logger.error("Failed to get MCP servers:", error);
    return NextResponse.json(
      { error: "Failed to get MCP servers" },
      { status: 500 }
    );
  }
}
