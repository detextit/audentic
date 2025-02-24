import { sql } from "@vercel/postgres";
import { AgentDBConfig, KnowledgeBaseDBArticle } from "@/agentBuilder/types";
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

// Create knowledge base article
export async function createKnowledgeBaseArticle(
  agentId: string,
  article: Partial<KnowledgeBaseDBArticle>
): Promise<KnowledgeBaseDBArticle> {
  const result = await sql`
    INSERT INTO knowledge_base (
      agent_id,
      title,
      content,
      metadata  
    )
    VALUES (
      ${agentId},
      ${article.title},
      ${article.content},
      ${JSON.stringify(article.metadata || {})}
    )
    RETURNING *;
  `;
  return transformDBKnowledgeBaseArticle(result.rows[0]);
}

// Get all knowledge base articles for an agent
export async function getAgentKnowledgeBase(
  agentId: string
): Promise<KnowledgeBaseDBArticle[]> {
  const result = await sql`
    SELECT * FROM knowledge_base 
    WHERE agent_id = ${agentId}
    ORDER BY created_at DESC;
  `;
  return result.rows.map(transformDBKnowledgeBaseArticle);
}

// Delete knowledge base article
export async function deleteKnowledgeBaseArticle(
  articleId: string
): Promise<boolean> {
  const result = await sql`
    DELETE FROM knowledge_base 
    WHERE id = ${articleId}
    RETURNING id;
  `;
  return result.rows.length > 0;
}

// Update knowledge base article
export async function updateKnowledgeBaseArticle(
  articleId: string,
  updates: Partial<KnowledgeBaseDBArticle>
): Promise<KnowledgeBaseDBArticle | null> {
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
    `UPDATE knowledge_base 
     SET ${updates_array.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${i}
     RETURNING *`,
    [...values, articleId]
  );

  return result.rows.length
    ? transformDBKnowledgeBaseArticle(result.rows[0])
    : null;
}

function transformDBKnowledgeBaseArticle(
  dbArticle: any
): KnowledgeBaseDBArticle {
  return {
    id: dbArticle.id,
    agentId: dbArticle.agent_id,
    title: dbArticle.title,
    content: dbArticle.content,
    metadata: dbArticle.metadata || {},
    createdAt: dbArticle.created_at,
    updatedAt: dbArticle.updated_at,
  };
}

// Add to existing exports
export async function getMcpServers(agentId: string) {
  const { rows } = await sql`
    SELECT name, env 
    FROM mcp_servers 
    WHERE agent_id = ${agentId}
  `;
  return rows;
}

export async function saveMcpServer(
  agentId: string,
  server: { name: string; env: Record<string, string> }
) {
  await sql`
    INSERT INTO mcp_servers (agent_id, name, env, updated_at)
    VALUES (${agentId}, ${server.name}, ${JSON.stringify(
    server.env
  )}, CURRENT_TIMESTAMP)
    ON CONFLICT (agent_id, name) 
    DO UPDATE SET env = ${JSON.stringify(
      server.env
    )}, updated_at = CURRENT_TIMESTAMP
  `;
}

export async function deleteMcpServer(agentId: string, serverName: string) {
  await sql`
    DELETE FROM mcp_servers 
    WHERE agent_id = ${agentId} 
    AND name = ${serverName}
  `;
}
