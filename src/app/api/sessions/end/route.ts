import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

interface TranscriptItem {
  type: string;
  title?: string;
  itemId: string;
  role?: string;
  data?: any;
  isHidden: boolean;
}

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
      const createdAtMs = Date.now();
      
      // Filter and log completed messages and breadcrumbs
      const itemsToLog = transcriptItems.filter(
        (item: TranscriptItem) => 
          // Include complete messages
          (item.type === "MESSAGE" && 
           item.title && 
           item.title.trim() !== "" &&
           !item.title.startsWith("Transcribing")) ||
          // Include all breadcrumbs
          (item.type === "BREADCRUMB" && 
           item.title)
      );

      for (const item of itemsToLog) {
        await sql`
          INSERT INTO transcript_items (
            item_id,
            session_id,
            type,
            role,
            title,
            data,
            created_at_ms,
            is_hidden
          )
          VALUES (
            ${item.itemId},
            ${sessionId},
            ${item.type},
            ${item.role || null},
            ${item.title},
            ${item.data ? JSON.stringify(item.data) : null},
            ${createdAtMs},
            ${item.isHidden}
          )
          ON CONFLICT (item_id) 
          DO UPDATE SET
            title = EXCLUDED.title,
            data = EXCLUDED.data,
            created_at_ms = EXCLUDED.created_at_ms,
            is_hidden = EXCLUDED.is_hidden
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
} 