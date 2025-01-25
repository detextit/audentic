import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

// Add this before the POST handler to ensure tables exist
async function createTablesIfNotExist() {
  // Create sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(255) PRIMARY KEY,
      agent_id VARCHAR(255),
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP
    );
  `;

  // Create events table with session reference
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) REFERENCES sessions(session_id),
      direction VARCHAR(50),
      event_name TEXT,
      event_data JSONB,
      timestamp TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create transcript table with session reference
  await sql`
    CREATE TABLE IF NOT EXISTS transcript_items (
      item_id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) REFERENCES sessions(session_id),
      type VARCHAR(50),
      role VARCHAR(50),
      title TEXT,
      data JSONB,
      timestamp VARCHAR(255),
      created_at_ms BIGINT,
      status VARCHAR(50),
      is_hidden BOOLEAN,
      last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

export async function POST(request: Request) {
  try {
    await createTablesIfNotExist();
    const { sessionId, agentId } = await request.json();

    await sql`
      INSERT INTO sessions (session_id, agent_id)
      VALUES (${sessionId}, ${agentId})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
