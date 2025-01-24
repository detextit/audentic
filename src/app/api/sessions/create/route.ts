import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Add this before the POST handler to ensure tables exist
async function createTablesIfNotExist() {
  // Create sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(255) PRIMARY KEY,
      agent_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP
    );
  `;

  // Create events table - simplified
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) REFERENCES sessions(session_id),
      direction VARCHAR(50),
      event_name TEXT,
      event_data JSONB,
      created_at TIMESTAMP
    );
  `;

  // Create transcript table - simplified further
  await sql`
    CREATE TABLE IF NOT EXISTS transcript_items (
      item_id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) REFERENCES sessions(session_id),
      type VARCHAR(50),
      role VARCHAR(50),
      title TEXT,
      data JSONB,
      created_at_ms BIGINT,
      is_hidden BOOLEAN DEFAULT false
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
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
} 