import { sql } from "@vercel/postgres";

export async function setupDatabase() {
  try {
    // Enable uuid-ossp extension if not enabled
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

    // Create agents table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        instructions TEXT NOT NULL,
        first_message TEXT,
        tools JSONB DEFAULT '[]',
        tool_logic JSONB DEFAULT '{}',
        downstream_agents JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("Database setup completed");
  } catch (error) {
    console.error("Error setting up database:", error);
    throw error;
  }
}
