import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { TranscriptItem } from "@audentic/react";

export async function POST(request: Request) {
  try {
    const { sessionId, transcriptItems } = await request.json();

    // First, end the session
    await sql`
      UPDATE sessions 
      SET ended_at = CURRENT_TIMESTAMP 
      WHERE session_id = ${sessionId}
    `;

    // Then, if transcript items are provided, log the final transcript
    if (transcriptItems) {
      // Filter and log completed messages and breadcrumbs
      const itemsToLog = transcriptItems.filter(
        (item: TranscriptItem) =>
          // Exclude complete messages
          !(
            item.role === "user" &&
            item.content.type === "text" &&
            item.content.text.trim() !== "" &&
            !item.content.text.includes("Transcribing")
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
