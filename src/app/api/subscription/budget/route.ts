import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserBudget, addUserBudget, recordUsage } from "@/db";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Budget API");

//eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBudget = await getUserBudget(userId);

    return NextResponse.json({ budget: userBudget });
  } catch (error) {
    logger.error("Error fetching user budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch user budget" },
      { status: 500 }
    );
  }
}

// Add to user budget
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amountToAdd } = await request.json();

    if (typeof amountToAdd !== "number" || amountToAdd <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const updatedBudget = await addUserBudget(userId, amountToAdd);

    return NextResponse.json({
      message: "Budget added successfully",
      budget: updatedBudget,
    });
  } catch (error) {
    logger.error("Error adding to user budget:", error);
    return NextResponse.json(
      { error: "Failed to add to budget" },
      { status: 500 }
    );
  }
}

// Record usage
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cost } = await request.json();

    if (typeof cost !== "number" || cost <= 0) {
      return NextResponse.json(
        { error: "Invalid cost amount" },
        { status: 400 }
      );
    }

    const result = await recordUsage(userId, cost);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message,
          budget: result.budget,
        },
        { status: 402 } // Payment Required
      );
    }

    return NextResponse.json({
      message: result.message,
      budget: result.budget,
    });
  } catch (error) {
    logger.error("Error recording usage:", error);
    return NextResponse.json(
      { error: "Failed to record usage" },
      { status: 500 }
    );
  }
}
