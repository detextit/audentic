import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createAgent,
  getUserAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
} from "@/db";
import { CreateAgentInput } from "@/agentBuilder/types";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("id");

    if (agentId) {
      const agent = await getAgentById(agentId);
      if (!agent) {
        return new NextResponse("Agent not found", { status: 404 });
      }
      return NextResponse.json(agent);
    }

    const agents = await getUserAgents(userId);
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateAgentInput = await request.json();
    const agent = await createAgent(userId, body);

    return NextResponse.json(agent);
  } catch (error: any) {
    console.error("Detailed API error:", {
      error,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("id");

    if (!agentId) {
      return new NextResponse("Agent ID is required", { status: 400 });
    }

    const updates: Partial<CreateAgentInput> = await request.json();
    const agent = await updateAgent(agentId, userId, updates);

    if (!agent) {
      return new NextResponse("Agent not found", { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error updating agent:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("id");

    if (!agentId) {
      return new NextResponse("Agent ID is required", { status: 400 });
    }

    const success = await deleteAgent(agentId, userId);

    if (!success) {
      return new NextResponse("Agent not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
