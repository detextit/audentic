import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { saveOpenAIApiKey, deleteOpenAIApiKey, getUserBudget } from "@/db";
import { createLogger } from "@/utils/logger";

const logger = createLogger("API Key Settings");

// GET: Retrieve API key information (status only, not the actual key for security)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBudget = await getUserBudget(userId);

    return NextResponse.json({
      isEnabled: userBudget.planType === "byok" && !!userBudget.openaiApiKey,
      planType: userBudget.planType,
    });
  } catch (error) {
    logger.error("Error retrieving API key info:", error);
    return NextResponse.json(
      { error: "Failed to retrieve API key information" },
      { status: 500 }
    );
  }
}

// POST: Save or update an API key
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Verify the API key is valid before saving
    const isValid = await verifyOpenAIApiKey(apiKey);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key" },
        { status: 400 }
      );
    }

    // Save the API key and update plan to BYOK
    const result = await saveOpenAIApiKey(userId, apiKey);

    return NextResponse.json({
      success: true,
      planType: result.planType,
    });
  } catch (error) {
    logger.error("Error saving API key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an API key
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove the API key and revert to free plan
    const result = await deleteOpenAIApiKey(userId);

    return NextResponse.json({
      success: true,
      planType: result.planType,
    });
  } catch (error) {
    logger.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}

// Endpoint to verify an API key without saving it
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Just verify the API key without saving
    const isValid = await verifyOpenAIApiKey(apiKey);

    return NextResponse.json({
      isValid,
    });
  } catch (error) {
    logger.error("Error verifying API key:", error);
    return NextResponse.json(
      { error: "Failed to verify API key" },
      { status: 500 }
    );
  }
}

// Verify if the API key for a user is valid by testing against the OpenAI API
export async function verifyOpenAIApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    return response.status === 200;
  } catch (error) {
    logger.error("Error verifying OpenAI API key:", error);
    return false;
  }
}
