import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { LoggedEvent } from "@audentic/react";

export async function POST(request: Request) {
  try {
    const { event, sessionId }: { event: LoggedEvent; sessionId: string } =
      await request.json();

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
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging event:", error);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}
