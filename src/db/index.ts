import { sql } from "@vercel/postgres";
import { AgentConfig } from "@audentic/react";
import { CreateAgentInput } from "../agentConfigs/types";
import { setupDatabase } from "@/db/setup";

// Create agent
export async function createAgent(
  userId: string,
  agent: CreateAgentInput
): Promise<AgentConfig> {
  const result = await sql`
    INSERT INTO agents (
      user_id, 
      name, 
      instructions, 
      first_message, 
      tools,
      tool_logic,
      downstream_agents
    )
    VALUES (
      ${userId}, 
      ${agent.name}, 
      ${agent.instructions}, 
      ${agent.firstMessage}, 
      ${JSON.stringify(agent.tools || [])},
      ${JSON.stringify(agent.toolLogic || {})},
      ${JSON.stringify(agent.downstreamAgents || [])}
    )
    RETURNING *;
  `;
  return transformDBAgent(result.rows[0]);
}

// Get all agents for a user
export async function getUserAgents(userId: string): Promise<AgentConfig[]> {
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
  agentId: string,
  userId: string
): Promise<AgentConfig | null> {
  const result = await sql`
    SELECT * FROM agents 
    WHERE id = ${agentId} AND user_id = ${userId}
  `;
  return result.rows.length ? transformDBAgent(result.rows[0]) : null;
}

// Update agent
export async function updateAgent(
  agentId: string,
  userId: string,
  updates: Partial<CreateAgentInput>
): Promise<AgentConfig | null> {
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

function transformDBAgent(dbAgent: any): AgentConfig {
  return {
    id: dbAgent.id,
    userId: dbAgent.user_id,
    name: dbAgent.name,
    instructions: dbAgent.instructions,
    firstMessage: dbAgent.first_message,
    tools: dbAgent.tools || [],
    toolLogic: dbAgent.tool_logic || {},
    downstreamAgents: dbAgent.downstream_agents || [],
  };
}

function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
