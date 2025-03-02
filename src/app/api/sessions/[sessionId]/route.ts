import { LoggedEvent, TranscriptItem } from "@audentic/react";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { CostData, DEFAULT_COST_DATA } from "@/types/cost";
import { createLogger } from "@/utils/logger";
import { processUsageData, calculateCosts } from "@/utils/costCalculation";

const logger = createLogger("Sessions API");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Run all queries in parallel since they're independent
    const [eventsResult, transcriptResult, sessionResult, agentResult] =
      await Promise.all([
        // Fetch events
        sql`
        SELECT 
          id, direction, event_name, event_data, timestamp
        FROM events 
        WHERE session_id = ${sessionId}
        ORDER BY timestamp ASC
      `,

        // Fetch transcript items - only completed messages
        sql`
        SELECT 
          item_id, role, content, timestamp
        FROM transcript_items 
        WHERE session_id = ${sessionId}
        ORDER BY timestamp ASC
      `,

        // Fetch session cost data
        sql`
        SELECT 
          total_cost, 
          ended_at, 
          usage_stats, 
          cost_breakdown,
          model_type,
          agent_id
        FROM sessions
        WHERE session_id = ${sessionId}
      `,

        // Fetch session.created event to get model info if needed
        sql`
        SELECT event_data->'session'->>'model' as model
        FROM events 
        WHERE session_id = ${sessionId}
          AND event_name = 'session.created'
        LIMIT 1
      `,
      ]);

    // Process cost data
    let costData: CostData | null = null;

    if (sessionResult.rows.length > 0) {
      const session = sessionResult.rows[0];

      // If session has complete cost data, use it
      if (session.usage_stats && session.cost_breakdown && session.total_cost) {
        costData = {
          usage: session.usage_stats || DEFAULT_COST_DATA.usage,
          costs: session.cost_breakdown || DEFAULT_COST_DATA.costs,
          total_cost: parseFloat(session.total_cost || 0),
          is_final: !!session.ended_at,
          isPro: session.model_type === "gpt-4o-realtime-preview",
        };
      } else {
        // Session exists but doesn't have complete cost data
        // Try to calculate it on the fly

        // First determine the model type
        let model = session.model_type;
        if (!model) {
          // Try to get model from session.created event
          model = agentResult.rows[0]?.model;

          // If still no model and we have agent_id, try to get from agent table
          if (!model && session.agent_id) {
            const agentModelResult = await sql`
              SELECT settings FROM agents WHERE id = ${session.agent_id}
            `;

            if (
              agentModelResult.rows.length > 0 &&
              agentModelResult.rows[0].settings
            ) {
              const settings = agentModelResult.rows[0].settings;
              const isAdvancedModel = settings.isAdvancedModel === true;

              model = isAdvancedModel
                ? "gpt-4o-realtime-preview"
                : "gpt-4o-mini-realtime-preview";

              logger.info(
                `Determined model ${model} from agent settings for session ${sessionId}`
              );
            }
          }

          // Default to non-pro model if still not found
          if (!model) {
            model = "gpt-4o-mini-realtime-preview";
          }
        }

        const isPro = model === "gpt-4o-realtime-preview";

        // Get usage data from response.done events
        const usageResult = await sql`
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

        const usageData = usageResult.rows[0]?.usage_data || [];
        const hasValidUsageData =
          usageData.length > 0 && usageData.some((data: any) => data !== null);

        if (hasValidUsageData) {
          // Process usage data and calculate costs
          const totalStats = processUsageData(usageData);
          const { costs, totalCost } = calculateCosts(totalStats, isPro);

          costData = {
            usage: totalStats,
            costs: costs,
            total_cost: totalCost,
            is_final: !!session.ended_at,
            isPro: isPro,
          };

          logger.info(
            `Calculated on-the-fly cost data for session ${sessionId}: $${totalCost.toFixed(
              6
            )}`
          );

          // Optionally update the session with the calculated data
          await sql`
            UPDATE sessions 
            SET 
              total_cost = ${totalCost},
              usage_stats = ${JSON.stringify(totalStats)},
              cost_breakdown = ${JSON.stringify(costs)},
              model_type = ${model}
            WHERE session_id = ${sessionId}
          `;
          logger.info(`Updated session ${sessionId} with calculated cost data`);
        }
      }
    }

    return NextResponse.json({
      events: eventsResult.rows.map(
        (row) =>
          ({
            id: row.id,
            direction: row.direction,
            eventName: row.event_name,
            eventData: row.event_data,
            timestamp: new Date(row.timestamp).toLocaleTimeString(),
          } as LoggedEvent)
      ),
      transcriptItems: transcriptResult.rows.map(
        (row) =>
          ({
            itemId: row.item_id,
            role: row.role,
            content: row.content,
            timestamp: new Date(Number(row.timestamp)).toLocaleTimeString(),
          } as TranscriptItem)
      ),
      costData,
    });
  } catch (error) {
    logger.error("Error fetching session data:", error);
    return NextResponse.json(
      { error: "Failed to fetch session data" },
      { status: 500 }
    );
  }
}
