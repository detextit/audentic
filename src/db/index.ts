import { sql } from "@vercel/postgres";
import { AgentDBConfig, KnowledgeBaseDBArticle } from "@/types/agent";
import { setupDatabase } from "@/db/setup";
import { WidgetBuilderConfiguration } from "@/types/widget";
import { createLogger } from "@/utils/logger";
import {
  UserBudget,
  NEW_USER_BUDGET,
  TRIAL_BUDGET,
  TRIAL_REFRESH_DAYS,
} from "@/types/budget";

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
      ${agent.webUI || null}
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

// User Budget Management
export async function getUserBudget(userId: string): Promise<UserBudget> {
  try {
    const result = await sql`
      SELECT * FROM user_budget
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      const nextRefreshDate = new Date();
      nextRefreshDate.setDate(nextRefreshDate.getDate() + TRIAL_REFRESH_DAYS); // 30 days from now

      const insertResult = await sql`
        INSERT INTO user_budget (
          user_id, 
          total_budget, 
          used_amount, 
          next_refresh_date, 
          plan_type,
          openai_api_key
        )
        VALUES (
          ${userId}, 
          ${NEW_USER_BUDGET.totalBudget}, 
          ${NEW_USER_BUDGET.usedAmount}, 
          ${nextRefreshDate.toISOString()}, 
          ${NEW_USER_BUDGET.planType},
          ${NEW_USER_BUDGET.openaiApiKey}
        )
        RETURNING *
      `;

      const newUserBudget = insertResult.rows[0];
      return {
        userId: newUserBudget.user_id,
        totalBudget: parseFloat(newUserBudget.total_budget),
        usedAmount: parseFloat(newUserBudget.used_amount),
        lastUpdated: newUserBudget.last_updated,
        nextRefreshDate: new Date(newUserBudget.next_refresh_date),
        planType: newUserBudget.plan_type,
        openaiApiKey: newUserBudget.openai_api_key || "",
      };
    }

    const userBudget = result.rows[0];

    // Check if budget needs to be refreshed
    const nextRefresh = new Date(userBudget.next_refresh_date);
    const now = new Date();

    if (now >= nextRefresh && userBudget.plan_type === "free") {
      // It's time to refresh the budget for free users
      const newNextRefresh = new Date();
      newNextRefresh.setDate(nextRefresh.getDate() + TRIAL_REFRESH_DAYS); // 30 days from next refresh

      const refreshResult = await sql`
        UPDATE user_budget
        SET 
          total_budget = ${TRIAL_BUDGET},
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
        lastUpdated: refreshedBudget.last_updated,
        nextRefreshDate: refreshedBudget.next_refresh_date,
        planType: refreshedBudget.plan_type,
        openaiApiKey: refreshedBudget.openai_api_key,
      };
    }

    return {
      userId: userBudget.user_id,
      totalBudget: parseFloat(userBudget.total_budget),
      usedAmount: parseFloat(userBudget.used_amount),
      lastUpdated: userBudget.last_updated,
      nextRefreshDate: userBudget.next_refresh_date,
      planType: userBudget.plan_type,
      openaiApiKey: userBudget.openai_api_key,
    };
  } catch (error) {
    logger.error("Error getting user budget:", error);
    throw error;
  }
}

// Save OpenAI API Key for a user
export async function saveOpenAIApiKey(userId: string, apiKey: string) {
  try {
    // Update the plan type to 'byok' and save the API key
    const result = await sql`
      UPDATE user_budget
      SET 
        openai_api_key = ${apiKey},
        plan_type = 'byok',
        last_updated = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;

    const updatedBudget = result.rows[0];
    return {
      userId: updatedBudget.user_id,
      totalBudget: parseFloat(updatedBudget.total_budget),
      usedAmount: parseFloat(updatedBudget.used_amount),
      lastUpdated: updatedBudget.last_updated,
      nextRefreshDate: updatedBudget.next_refresh_date,
      planType: updatedBudget.plan_type,
      openaiApiKey: updatedBudget.openai_api_key,
    };
  } catch (error) {
    logger.error("Error saving OpenAI API key:", error);
    throw error;
  }
}

// Delete OpenAI API Key for a user
export async function deleteOpenAIApiKey(userId: string) {
  try {
    // Update the plan type back to 'free' and remove the API key
    const result = await sql`
      UPDATE user_budget
      SET 
        openai_api_key = NULL,
        plan_type = 'free',
        last_updated = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;

    const updatedBudget = result.rows[0];
    return {
      userId: updatedBudget.user_id,
      totalBudget: parseFloat(updatedBudget.total_budget),
      usedAmount: parseFloat(updatedBudget.used_amount),
      lastUpdated: updatedBudget.last_updated,
      nextRefreshDate: new Date(updatedBudget.next_refresh_date),
      planType: updatedBudget.plan_type,
      openaiApiKey: null,
    };
  } catch (error) {
    logger.error("Error deleting OpenAI API key:", error);
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
      ? new Date(Date.now() + TRIAL_REFRESH_DAYS * 24 * 60 * 60 * 1000) // 30 days from now
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
      lastUpdated: updatedBudget.last_updated,
      nextRefreshDate: new Date(updatedBudget.next_refresh_date),
      planType: updatedBudget.plan_type,
      openaiApiKey: updatedBudget.openai_api_key,
    };
  } catch (error) {
    logger.error("Error updating user budget:", error);
    throw error;
  }
}

export async function recordUsage(userId: string, cost: number) {
  try {
    const currentBudget = await getUserBudget(userId);

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

// Get widget configuration for an agent
export async function getWidgetConfig(
  agentId: string
): Promise<WidgetBuilderConfiguration | null> {
  const result = await sql`
    SELECT config FROM widget_config 
    WHERE agent_id = ${agentId}
  `;

  return result.rows.length ? result.rows[0].config : null;
}

// Save or update widget configuration
export async function saveWidgetConfig(
  agentId: string,
  config: WidgetBuilderConfiguration
): Promise<WidgetBuilderConfiguration> {
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
