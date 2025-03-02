import { NextResponse } from "next/server";
import { getWidgetConfig, saveWidgetConfig } from "@/db";
import { auth } from "@clerk/nextjs/server";

// GET handler to retrieve widget configuration
export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  // Add authentication check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { agentId } = await params;
    const config = await getWidgetConfig(agentId);

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching widget config:", error);
    return NextResponse.json(
      { error: "Failed to fetch widget configuration" },
      { status: 500 }
    );
  }
}

// POST handler to save widget configuration
export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  // Add authentication check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { agentId } = await params;
    const body = await request.json();
    const { config } = body;

    await saveWidgetConfig(agentId, config);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving widget config:", error);
    return NextResponse.json(
      { error: "Failed to save widget configuration" },
      { status: 500 }
    );
  }
}
