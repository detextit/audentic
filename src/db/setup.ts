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
        description TEXT NOT NULL,
        personality TEXT DEFAULT '',
        initiate_conversation BOOLEAN DEFAULT true,
        instructions TEXT NOT NULL,
        tools JSONB DEFAULT '[]',
        tool_logic JSONB DEFAULT '{}',
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
