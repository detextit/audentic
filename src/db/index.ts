import { sql } from "@vercel/postgres";
import { AgentDBConfig } from "../agentBuilder/types";
import { setupDatabase } from "@/db/setup";

// Create agent
export async function createAgent(
  userId: string,
  agent: AgentDBConfig
): Promise<AgentDBConfig> {
  const result = await sql`
    INSERT INTO agents (
      user_id,
      name,
      description,
      personality,
      initiate_conversation,
      instructions,
      tools,
      tool_logic,
      settings
    )
    VALUES (
      ${userId},
      ${agent.name},
      ${agent.description},
      ${agent.personality || ""},
      ${agent.initiateConversation},
      ${agent.instructions},
      ${JSON.stringify(agent.tools || [])},
      ${JSON.stringify(agent.toolLogic || {})},
      ${JSON.stringify(agent.settings || {})}
    )
    RETURNING *;
  `;
  return transformDBAgent(result.rows[0]);
}

// Get all agents for a user
export async function getUserAgents(userId: string): Promise<AgentDBConfig[]> {
  try {
    const result = await sql`
      SELECT * FROM agents 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC;
    `;
    return result.rows.map(transformDBAgent);
  } catch (error: any) {
    // If the error is about missing table, try to setup the database
    if (error.code === "42P01") {
      // PostgreSQL error code for undefined_table
      await setupDatabase();
      // Retry the query after setup
      const result = await sql`
        SELECT * FROM agents 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC;
      `;
      return result.rows.map(transformDBAgent);
    }
    throw error;
  }
}

// Get single agent by ID
export async function getAgentById(
  agentId: string
): Promise<AgentDBConfig | null> {
  const result = await sql`
    SELECT * FROM agents 
    WHERE id = ${agentId}
  `;
  return result.rows.length ? transformDBAgent(result.rows[0]) : null;
}

// Update agent
export async function updateAgent(
  agentId: string,
  userId: string,
  updates: Partial<AgentDBConfig>
): Promise<AgentDBConfig | null> {
  const updates_array = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const dbKey = snakeCase(key);
      const processedValue =
        typeof value === "object" ? JSON.stringify(value) : value;
      updates_array.push(`"${dbKey}" = $${i}`);
      values.push(processedValue);
      i++;
    }
  }

  if (updates_array.length === 0) return null;

  const result = await sql.query(
    `UPDATE agents 
     SET ${updates_array.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${i} AND user_id = $${i + 1}
     RETURNING *`,
    [...values, agentId, userId]
  );

  return result.rows.length ? transformDBAgent(result.rows[0]) : null;
}

// Delete agent
export async function deleteAgent(
  agentId: string,
  userId: string
): Promise<boolean> {
  const result = await sql`
    DELETE FROM agents 
    WHERE id = ${agentId} AND user_id = ${userId}
    RETURNING id;
  `;
  return result.rows.length > 0;
}

function transformDBAgent(dbAgent: any): AgentDBConfig {
  return {
    id: dbAgent.id,
    userId: dbAgent.user_id,
    name: dbAgent.name,
    description: dbAgent.description,
    personality: dbAgent.personality || "",
    initiateConversation: dbAgent.initiate_conversation,
    instructions: dbAgent.instructions,
    tools: dbAgent.tools || [],
    toolLogic: dbAgent.tool_logic || {},
    settings: dbAgent.settings || {},
    createdAt: dbAgent.created_at,
    updatedAt: dbAgent.updated_at,
  };
}

function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
