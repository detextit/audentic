import { NextResponse } from "next/server";
import { setupDatabase } from "@/db/setup";

export async function POST() {
  try {
    await setupDatabase();
    return NextResponse.json({ message: "Database setup completed" });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup database" },
      { status: 500 }
    );
  }
}
