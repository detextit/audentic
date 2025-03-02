import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { TranscriptItem } from "@audentic/react";
import { processUsageData, calculateCosts } from "@/utils/costCalculation";

export async function POST(request: Request) {
  try {
    const { sessionId, transcriptItems } = await request.json();

    // Calculate the total cost for the session
    // First get the model type from session.created event
    const modelResult = await sql`
      SELECT event_data->'session'->>'model' as model
      FROM events 
      WHERE session_id = ${sessionId}
        AND event_name = 'session.created'
      LIMIT 1
    `;

    const model = modelResult.rows[0]?.model;
    const isPro = model === "gpt-4o-realtime-preview";

    // Get token usage data
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

    const usageData = result.rows[0].usage_data || [];

    // Process usage data and calculate costs
    const totalStats = processUsageData(usageData);
    const { costs, totalCost } = calculateCosts(totalStats, isPro);

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

    // Then, if transcript items are provided, log the final transcript
    if (transcriptItems) {
      // Filter and log completed messages and breadcrumbs
      const itemsToLog = transcriptItems.filter(
        (item: TranscriptItem) =>
          // Exclude incomplete messages
          !(
            item.role === "user" &&
            item.content.type === "text" &&
            (item.content.text.trim() == "" ||
              item.content.text.includes("Transcribing"))
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
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
