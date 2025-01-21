import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { event, sessionId } = await request.json();
    
    // Convert timestamp to ISO string for proper PostgreSQL timestamp
    const timestamp = new Date().toISOString();

    await sql`
      INSERT INTO events (
        id, 
        session_id, 
        direction, 
        event_name, 
        event_data,
        created_at
      )
      VALUES (
        ${event.id}, 
        ${sessionId}, 
        ${event.direction}, 
        ${event.eventName}, 
        ${JSON.stringify(event.eventData)},
        ${timestamp}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging event:', error);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
} 