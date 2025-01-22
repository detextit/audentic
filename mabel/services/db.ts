import { sql } from "@vercel/postgres";
import { LoggedEvent, TranscriptItem } from "../types";

export async function createTables() {
  // Create sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(255) PRIMARY KEY,
      agent_id VARCHAR(255),
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP
    );
  `;

  // Create events table with session reference
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) REFERENCES sessions(session_id),
      direction VARCHAR(50),
      event_name TEXT,
      event_data JSONB,
      timestamp TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create transcript table with session reference
  await sql`
    CREATE TABLE IF NOT EXISTS transcript_items (
      item_id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) REFERENCES sessions(session_id),
      type VARCHAR(50),
      role VARCHAR(50),
      title TEXT,
      data JSONB,
      timestamp VARCHAR(255),
      created_at_ms BIGINT,
      status VARCHAR(50),
      is_hidden BOOLEAN,
      last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

export const dbService = {
  async createSession(sessionId: string, agentId: string) {
    try {
      await sql`
        INSERT INTO sessions (session_id, agent_id)
        VALUES (${sessionId}, ${agentId})
      `;
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async endSession(sessionId: string) {
    try {
      await sql`
        UPDATE sessions 
        SET ended_at = CURRENT_TIMESTAMP 
        WHERE session_id = ${sessionId}
      `;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  },

  async logEvent(event: LoggedEvent, sessionId: string) {
    try {
      await sql`
        INSERT INTO events (id, session_id, direction, event_name, event_data, timestamp)
        VALUES (
          ${event.id}, 
          ${sessionId}, 
          ${event.direction}, 
          ${event.eventName}, 
          ${JSON.stringify(event.eventData)}, 
          ${event.timestamp}
        )
      `;
    } catch (error) {
      console.error('Error logging event to database:', error);
    }
  },

  async logTranscriptItem(item: TranscriptItem, sessionId: string) {
    try {
      await sql`
        INSERT INTO transcript_items (
          item_id, session_id, type, role, title, data, timestamp, 
          created_at_ms, status, is_hidden
        )
        VALUES (
          ${item.itemId},
          ${sessionId},
          ${item.type},
          ${item.role || null},
          ${item.title || null},
          ${item.data ? JSON.stringify(item.data) : null},
          ${item.timestamp},
          ${item.createdAtMs},
          ${item.status || null},
          ${item.isHidden}
        )
      `;
    } catch (error) {
      console.error('Error logging transcript item to database:', error);
    }
  },

  async updateTranscriptItem(itemId: string, updates: Partial<TranscriptItem>) {
    try {
      const updateFields = Object.entries(updates)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : value
        }));

      if (updateFields.length > 0) {
        const setClause = updateFields
          .map(({ key }) => `${key} = $${key}`)
          .join(', ');

        const values = Object.fromEntries(
          updateFields.map(({ key, value }) => [key, value])
        );

        await sql.query(
          `UPDATE transcript_items 
           SET ${setClause}, last_updated_at = CURRENT_TIMESTAMP 
           WHERE item_id = ${itemId},
           ${values}`
        );
      }
    } catch (error) {
      console.error('Error updating transcript item:', error);
    }
  }
}; 