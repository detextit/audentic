import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { TranscriptItem } from "@audentic/react";
import { processUsageData, calculateCosts } from "@/utils/costCalculation";
import { createLogger } from "@/utils/logger";
import { DEFAULT_COST_DATA } from "@/types/cost";
import { getAgentById, recordUsage } from "@/db";

const logger = createLogger("Sessions End API");

const isProModel = (model: string | null | undefined) => {
  if (!model) return false;
  const normalized = model.toLowerCase();
  if (normalized.includes("mini")) return false;
  if (normalized === "gpt-realtime") return true;
  if (normalized.startsWith("gpt-realtime")) return true;
  if (normalized.startsWith("gpt-4o-realtime")) return true;
  return false;
};

export async function POST(request: Request) {
  try {
    const { sessionId, transcriptItems } = await request.json();

    // Check if the session already exists and has been ended
    const sessionCheck = await sql`
      SELECT ended_at, agent_id FROM sessions WHERE session_id = ${sessionId}
    `;

    // If session is already ended, don't process it again
    if (sessionCheck.rows.length > 0 && sessionCheck.rows[0].ended_at) {
      logger.info(`Session ${sessionId} already ended, skipping processing`);
      return NextResponse.json({ success: true, status: "already_ended" });
    }

    const agentId =
      sessionCheck.rows.length > 0 ? sessionCheck.rows[0].agent_id : null;

    // Calculate the total cost for the session
    // First get the model type from session.created event
    const modelResult = await sql`
      SELECT event_data->'session'->>'model' as model
      FROM events 
      WHERE session_id = ${sessionId}
        AND event_name = 'session.created'
      LIMIT 1
    `;

    let model = modelResult.rows[0]?.model;
    let isPro = isProModel(model);

    // If model is not found in events, try to get it from the agent table
    if (!model && agentId) {
      logger.info(
        `Model not found in events for session ${sessionId}, trying agent table`
      );
      const agentResult = await sql`
        SELECT settings FROM agents WHERE id = ${agentId}
      `;

      if (agentResult.rows.length > 0 && agentResult.rows[0].settings) {
        const settings = agentResult.rows[0].settings;
        const isAdvancedModel = settings.isAdvancedModel === true;

        model = isAdvancedModel ? "gpt-realtime" : "gpt-realtime-mini";

        isPro = isProModel(model);

        logger.info(
          `Determined model ${model} from agent settings for session ${sessionId}`
        );
      } else {
        // Default to non-pro model if not found
        model = "gpt-realtime-mini";
        isPro = isProModel(model);
        logger.warn(
          `Model not found for session ${sessionId}, defaulting to ${model}`
        );
      }
    }

    // Get token usage data from response.done events
    const result = await sql`
      SELECT 
        jsonb_agg(
          CASE 
            WHEN event_name = 'response.done' 
            THEN event_data->'response'->'usage' 
          END
        ) as usage_data
      FROM events 
      WHERE session_id = ${sessionId}
        AND event_name = 'response.done'
    `;

    const usageData = result.rows[0]?.usage_data || [];

    // Check if we have valid usage data
    const hasValidUsageData =
      usageData.length > 0 && usageData.some((data: any) => data !== null);

    let totalStats, costs, totalCost;

    if (hasValidUsageData) {
      // Process usage data and calculate costs
      totalStats = processUsageData(usageData);
      const costResult = calculateCosts(totalStats, isPro);
      costs = costResult.costs;
      totalCost = costResult.totalCost;
    } else {
      // No valid usage data found, use default values
      logger.warn(
        `No valid usage data found for session ${sessionId}, using default values`
      );
      totalStats = DEFAULT_COST_DATA.usage;
      costs = DEFAULT_COST_DATA.costs;
      totalCost = 0;

      // Try to estimate usage from other events if possible
      const messageEvents = await sql`
        SELECT COUNT(*) as message_count
        FROM events 
        WHERE session_id = ${sessionId}
          AND event_name IN ('message.created', 'message.received')
      `;

      if (messageEvents.rows[0]?.message_count > 0) {
        const messageCount = parseInt(messageEvents.rows[0].message_count);
        // Very rough estimation - assume average token usage per message
        const estimatedTokens = messageCount * 100;

        if (isPro) {
          // Rough estimate for Pro model
          totalCost = estimatedTokens * 0.00001; // $0.01 per 1000 tokens rough estimate
        } else {
          // Rough estimate for Base model
          totalCost = estimatedTokens * 0.000001; // $0.001 per 1000 tokens rough estimate
        }

        logger.info(
          `Estimated cost for session ${sessionId} based on ${messageCount} messages: $${totalCost.toFixed(
            6
          )}`
        );
      }
    }

    // End the session and update with all cost and usage information
    await sql`
      UPDATE sessions 
      SET 
        ended_at = CURRENT_TIMESTAMP,
        total_cost = ${totalCost},
        usage_stats = ${JSON.stringify(totalStats)},
        cost_breakdown = ${JSON.stringify(costs)},
        model_type = ${model}
      WHERE session_id = ${sessionId}
    `;

    // Record the usage cost in the user's budget if we have an agent ID
    if (agentId) {
      try {
        const agent = await getAgentById(agentId);
        if (agent && agent.userId) {
          // Record the usage cost
          const usageResult = await recordUsage(agent.userId, totalCost);

          if (!usageResult.success) {
            logger.warn(
              `Failed to record usage for user ${agent.userId}: ${usageResult.message}`
            );
          } else {
            logger.info(
              `Recorded usage of $${totalCost.toFixed(6)} for user ${agent.userId
              }`
            );
          }
        }
      } catch (error) {
        logger.error("Error recording usage:", error);
        // Continue with the session end process even if recording usage fails
      }
    }

    // Then, if transcript items are provided, log the final transcript
    if (transcriptItems) {
      // Filter and log completed messages and breadcrumbs
      const itemsToLog = transcriptItems.filter(
        (item: TranscriptItem) =>
          // Exclude incomplete messages
          !(
            item.role === "user" &&
            item.content.type === "text" &&
            ((item.content as any).text.trim() == "" ||
              (item.content as any).text.includes("Transcribing"))
          )
      );

      for (const item of itemsToLog) {
        await sql`
          INSERT INTO transcript_items (
            item_id,
            session_id,
            role,
            content,
            timestamp
          )
          VALUES (
            ${item.itemId},
            ${sessionId},
            ${item.role},
            ${item.content ? JSON.stringify(item.content) : null},
            ${item.timestamp}
          )
          ON CONFLICT (item_id) 
          DO UPDATE SET
            role = EXCLUDED.role,
            content = EXCLUDED.content,
            timestamp = EXCLUDED.timestamp
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
