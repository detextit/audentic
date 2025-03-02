import { NextResponse } from "next/server";
import { saveMcpServer, deleteMcpServer, getMcpServers } from "@/db";
import { createLogger } from "@/utils/logger";

const logger = createLogger("MCP Servers API");

export async function POST(request: Request) {
  try {
    const { agentId, server } = await request.json();
    await saveMcpServer(agentId, server);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to save MCP server:", error);
    return NextResponse.json(
      { error: "Failed to save MCP server" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { agentId } = await request.json();
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

export async function DELETE(request: Request) {
  try {
    const { agentId, serverName } = await request.json();
    await deleteMcpServer(agentId, serverName);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete MCP server:", error);
    return NextResponse.json(
      { error: "Failed to delete MCP server" },
      { status: 500 }
    );
  }
}
