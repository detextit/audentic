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
          id, direction, event_name, event_data, created_at
        FROM events 
        WHERE session_id = ${sessionId}
        ORDER BY created_at ASC
      `,

      // Fetch transcript items - only completed messages
      sql`
        SELECT 
          item_id, type, role, title, data, created_at_ms, is_hidden
        FROM transcript_items 
        WHERE session_id = ${sessionId}
          AND (
            (role = 'user' AND title NOT ILIKE 'Transcribing%')  -- Skip "Transcribing..." messages
            OR role = 'assistant'
            OR role IS NULL
          )
        ORDER BY created_at_ms ASC
      `,
    ]);

    return NextResponse.json({
      events: eventsResult.rows.map((row) => ({
        id: row.id,
        direction: row.direction,
        eventName: row.event_name,
        eventData: row.event_data,
        timestamp: new Date(row.created_at).toLocaleTimeString(),
        expanded: false,
      })),
      transcriptItems: transcriptResult.rows.map((row) => ({
        itemId: row.item_id,
        type: row.type,
        role: row.role,
        title: row.title,
        data: row.data,
        timestamp: new Date(Number(row.created_at_ms)).toLocaleTimeString(),
        createdAtMs: Number(row.created_at_ms),
        isHidden: row.is_hidden,
        expanded: false,
        status: "DONE",
      })),
    });
  } catch (error) {
    console.error("Error fetching session data:", error);
    return NextResponse.json(
      { error: "Failed to fetch session data" },
      { status: 500 }
    );
  }
}
