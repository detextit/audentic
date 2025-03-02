import { LoggedEvent, TranscriptItem } from "@audentic/react";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { CostData, DEFAULT_COST_DATA } from "@/types/cost";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Sessions API");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Run all queries in parallel since they're independent
    const [eventsResult, transcriptResult, sessionResult] = await Promise.all([
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
          model_type
        FROM sessions
        WHERE session_id = ${sessionId}
      `,
    ]);

    // Process cost data
    let costData: CostData | null = null;
    if (sessionResult.rows.length > 0) {
      const session = sessionResult.rows[0];
      costData = {
        usage: session.usage_stats || DEFAULT_COST_DATA.usage,
        costs: session.cost_breakdown || DEFAULT_COST_DATA.costs,
        total_cost: parseFloat(session.total_cost || 0),
        is_final: !!session.ended_at,
        isPro: session.model_type === "gpt-4o-realtime-preview",
      };
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
