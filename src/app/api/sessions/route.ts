import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("sessions");
  try {
    const result = await sql`
      SELECT * FROM sessions 
      ORDER BY started_at DESC
    `;
    return NextResponse.json(result.rows);
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