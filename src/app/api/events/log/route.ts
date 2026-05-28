import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { LoggedEvent } from "@audentic/react";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Events Log API");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { event, sessionId }: { event: LoggedEvent; sessionId: string } =
      await request.json();

    if (!sessionId || !event?.id) {
      return NextResponse.json(
        { error: "Missing event or sessionId" },
        { status: 400, headers: corsHeaders }
      );
    }

    await sql`
      INSERT INTO sessions (session_id)
      VALUES (${sessionId})
      ON CONFLICT (session_id) DO NOTHING
    `;

    await sql`
      INSERT INTO events (
        id, 
        session_id, 
        direction, 
        event_name, 
        event_data,
        timestamp
      )
      VALUES (
        ${event.id}, 
        ${sessionId}, 
        ${event.direction}, 
        ${event.eventName}, 
        ${JSON.stringify(event.eventData)},
        ${event.timestamp}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        session_id = EXCLUDED.session_id,
        direction = EXCLUDED.direction,
        event_name = EXCLUDED.event_name,
        event_data = EXCLUDED.event_data,
        timestamp = EXCLUDED.timestamp
    `;

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    logger.error("Error logging event:", error);
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500, headers: corsHeaders }
    );
  }
}
