import { sql } from "@vercel/postgres";
import { AgentDBConfig, KnowledgeBaseDBArticle } from "@/agentBuilder/types";
import { setupDatabase } from "@/db/setup";
import { WidgetConfiguration } from "@/app/agents/WidgetConfiguration";
import { createLogger } from "@/utils/logger";

const logger = createLogger("DB Actions");

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
      settings,
      webui
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
      ${JSON.stringify(agent.settings || {})},
      ${agent.webui || null}
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
    webUI: dbAgent.webui || "",
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
  logger.debug("Getting MCP servers for agent:", agentId);
  const { rows } = await sql`
    SELECT name, env 
    FROM mcp_servers 
    WHERE agent_id = ${agentId}
  `;
  return rows.map((row) => ({
    name: row.name,
    env: row.env,
  }));
}

export async function saveMcpServer(
  agentId: string,
  server: { name: string; env: Record<string, string> }
) {
  logger.debug("Saving server:", server);
  await sql`
    INSERT INTO mcp_servers (agent_id, name, env)
    VALUES (${agentId}, ${server.name}, ${JSON.stringify(server.env)})
    ON CONFLICT (agent_id, name)
    DO UPDATE SET env = ${JSON.stringify(
      server.env
    )}, updated_at = CURRENT_TIMESTAMP
  `;
}

export async function deleteMcpServer(agentId: string, serverName: string) {
  try {
    await sql`
      DELETE FROM mcp_servers
      WHERE agent_id = ${agentId} AND name = ${serverName}
    `;
    return true;
  } catch (error) {
    logger.error("Error deleting MCP server:", error);
    return false;
  }
}

// User Budget Management

export async function getUserBudget(userId: string) {
  try {
    const result = await sql`
      SELECT * FROM user_budget
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      // Initialize budget for new user with default values (free plan gets $5)
      const defaultBudget = 5.0;
      const nextRefreshDate = new Date();
      nextRefreshDate.setDate(nextRefreshDate.getDate() + 30); // 30 days from now

      await sql`
        INSERT INTO user_budget (
          user_id, 
          total_budget, 
          used_amount, 
          next_refresh_date, 
          plan_type
        )
        VALUES (
          ${userId}, 
          ${defaultBudget}, 
          0, 
          ${nextRefreshDate.toISOString()}, 
          'free'
        )
      `;

      return {
        userId,
        totalBudget: defaultBudget,
        usedAmount: 0,
        remainingBudget: defaultBudget,
        lastUpdated: new Date(),
        nextRefreshDate: nextRefreshDate,
        planType: "free",
      };
    }

    const userBudget = result.rows[0];

    // Check if budget needs to be refreshed
    const nextRefresh = new Date(userBudget.next_refresh_date);
    const now = new Date();

    if (now >= nextRefresh && userBudget.plan_type === "free") {
      // It's time to refresh the budget for free users
      const refreshAmount = 5.0; // $5 for free plan
      const newNextRefresh = new Date();
      newNextRefresh.setDate(nextRefresh.getDate() + 30); // 30 days from next refresh

      const refreshResult = await sql`
        UPDATE user_budget
        SET 
          total_budget = total_budget + ${refreshAmount},
          next_refresh_date = ${newNextRefresh.toISOString()},
          last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;

      const refreshedBudget = refreshResult.rows[0];
      return {
        userId: refreshedBudget.user_id,
        totalBudget: parseFloat(refreshedBudget.total_budget),
        usedAmount: parseFloat(refreshedBudget.used_amount),
        remainingBudget:
          parseFloat(refreshedBudget.total_budget) -
          parseFloat(refreshedBudget.used_amount),
        lastUpdated: refreshedBudget.last_updated,
        nextRefreshDate: new Date(refreshedBudget.next_refresh_date),
        planType: refreshedBudget.plan_type,
      };
    }

    return {
      userId: userBudget.user_id,
      totalBudget: parseFloat(userBudget.total_budget),
      usedAmount: parseFloat(userBudget.used_amount),
      remainingBudget:
        parseFloat(userBudget.total_budget) -
        parseFloat(userBudget.used_amount),
      lastUpdated: userBudget.last_updated,
      nextRefreshDate: new Date(userBudget.next_refresh_date),
      planType: userBudget.plan_type,
    };
  } catch (error) {
    logger.error("Error getting user budget:", error);
    throw error;
  }
}

export async function addUserBudget(
  userId: string,
  amountToAdd: number,
  planType?: string
) {
  try {
    const currentBudget = await getUserBudget(userId);

    // If plan type is changing, update the next refresh date
    const updatePlanType = planType && planType !== currentBudget.planType;
    const nextRefreshDate = updatePlanType
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      : currentBudget.nextRefreshDate;

    let query;
    if (updatePlanType) {
      query = sql`
        UPDATE user_budget
        SET 
          total_budget = ${currentBudget.totalBudget + amountToAdd},
          last_updated = CURRENT_TIMESTAMP,
          plan_type = ${planType},
          next_refresh_date = ${nextRefreshDate.toISOString()}
        WHERE user_id = ${userId}
        RETURNING *
      `;
    } else {
      query = sql`
        UPDATE user_budget
        SET 
          total_budget = ${currentBudget.totalBudget + amountToAdd},
          last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    }

    const result = await query;

    const updatedBudget = result.rows[0];
    return {
      userId: updatedBudget.user_id,
      totalBudget: parseFloat(updatedBudget.total_budget),
      usedAmount: parseFloat(updatedBudget.used_amount),
      remainingBudget:
        parseFloat(updatedBudget.total_budget) -
        parseFloat(updatedBudget.used_amount),
      lastUpdated: updatedBudget.last_updated,
      nextRefreshDate: new Date(updatedBudget.next_refresh_date),
      planType: updatedBudget.plan_type,
    };
  } catch (error) {
    logger.error("Error updating user budget:", error);
    throw error;
  }
}

export async function recordUsage(userId: string, cost: number) {
  try {
    const currentBudget = await getUserBudget(userId);

    // Check if user has enough budget
    if (currentBudget.remainingBudget < cost) {
      return {
        success: false,
        message: "Insufficient budget",
        budget: currentBudget,
      };
    }

    const result = await sql`
      UPDATE user_budget
      SET 
        used_amount = ${currentBudget.usedAmount + cost},
        last_updated = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;

    const updatedBudget = result.rows[0];
    return {
      success: true,
      message: "Usage recorded successfully",
      budget: {
        userId: updatedBudget.user_id,
        totalBudget: parseFloat(updatedBudget.total_budget),
        usedAmount: parseFloat(updatedBudget.used_amount),
        remainingBudget:
          parseFloat(updatedBudget.total_budget) -
          parseFloat(updatedBudget.used_amount),
        lastUpdated: updatedBudget.last_updated,
        nextRefreshDate: new Date(updatedBudget.next_refresh_date),
        planType: updatedBudget.plan_type,
      },
    };
  } catch (error) {
    logger.error("Error recording usage:", error);
    throw error;
  }
}

export async function hasEnoughBudget(
  userId: string,
  estimatedCost: number = 0.01
) {
  try {
    const userBudget = await getUserBudget(userId);
    return {
      hasEnough: userBudget.remainingBudget >= estimatedCost,
      budget: userBudget,
    };
  } catch (error) {
    logger.error("Error checking budget:", error);
    return {
      hasEnough: false,
      budget: null,
      error: "Failed to check budget",
    };
  }
}

// Get widget configuration for an agent
export async function getWidgetConfig(
  agentId: string
): Promise<WidgetConfiguration | null> {
  const result = await sql`
    SELECT config FROM widget_config 
    WHERE agent_id = ${agentId}
  `;

  return result.rows.length ? result.rows[0].config : null;
}

// Save or update widget configuration
export async function saveWidgetConfig(
  agentId: string,
  config: WidgetConfiguration
): Promise<WidgetConfiguration> {
  const result = await sql`
    INSERT INTO widget_config (agent_id, config)
    VALUES (${agentId}, ${JSON.stringify(config)})
    ON CONFLICT (agent_id)
    DO UPDATE SET 
      config = ${JSON.stringify(config)},
      updated_at = CURRENT_TIMESTAMP
    RETURNING config
  `;

  return result.rows[0].config;
}

// Update agent UI
export async function updateAgentUI(
  agentId: string,
  webUI: string
): Promise<boolean> {
  try {
    await sql`
      UPDATE agents
      SET webui = ${webUI}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${agentId}
    `;
    return true;
  } catch (error) {
    logger.error("Failed to update agent UI:", error);
    return false;
  }
}
