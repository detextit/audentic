import { sql } from "@vercel/postgres";
import { createLogger } from "@/utils/logger";

const logger = createLogger("DB Setup");

export async function setupDatabase() {
  try {
    const setupOperations = [
      // Enable uuid-ossp extension if not enabled
      sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

      // Create agents table if it doesn't exist
      sql`
        CREATE TABLE IF NOT EXISTS agents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id TEXT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT DEFAULT '',
          personality TEXT DEFAULT '',
          initiate_conversation BOOLEAN DEFAULT true,
          instructions TEXT DEFAULT 'You are a helpful assistant.',
          tools JSONB DEFAULT '[]',
          tool_logic JSONB DEFAULT '{}',
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,

      // Create sessions table
      sql`
        CREATE TABLE IF NOT EXISTS sessions (
          session_id VARCHAR(255) PRIMARY KEY,
          agent_id VARCHAR(255),
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP,
          total_cost DECIMAL(10, 6) DEFAULT 0,
          usage_stats JSONB DEFAULT NULL,
          cost_breakdown JSONB DEFAULT NULL,
          model_type VARCHAR(50) DEFAULT NULL
        )
      `,

      // Create events table with session reference
      sql`
        CREATE TABLE IF NOT EXISTS events (
          id VARCHAR(255) PRIMARY KEY,
          session_id VARCHAR(255) REFERENCES sessions(session_id),
          direction VARCHAR(50),
          event_name TEXT,
          event_data JSONB,
          timestamp TIMESTAMP
        )
      `,

      // Create transcript table with session reference
      sql`
        CREATE TABLE IF NOT EXISTS transcript_items (
          item_id VARCHAR(255) PRIMARY KEY,
          session_id VARCHAR(255) REFERENCES sessions(session_id),
          role VARCHAR(50),
          content JSONB,
          timestamp TIMESTAMP
        )
      `,

      // Create knowledge_base table
      sql`
        CREATE TABLE IF NOT EXISTS knowledge_base (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,

      // Create mcp_servers table
      sql`
        CREATE TABLE IF NOT EXISTS mcp_servers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          env JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (agent_id, name)
        )
      `,
    ];

    await Promise.all(setupOperations);
    logger.info(
      "Database setup - Agents, Sessions, Events, Transcript, Knowledge Base Articles, MCP Servers - initiated"
    );
  } catch (error) {
    logger.error("Error setting up database:", error);
    throw error;
  }
}
