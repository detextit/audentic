import { LoggedEvent, TranscriptItem } from "@audentic/react";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Run both queries in parallel since they're independent
    const [eventsResult, transcriptResult] = await Promise.all([
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
    ]);

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
    });
  } catch (error) {
    console.error("Error fetching session data:", error);
    return NextResponse.json(
      { error: "Failed to fetch session data" },
      { status: 500 }
    );
  }
}
