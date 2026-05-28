import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { TranscriptItem } from "@audentic/react";
import { processUsageData, calculateCosts } from "@/utils/costCalculation";
import { createLogger } from "@/utils/logger";
import { DEFAULT_COST_DATA } from "@/types/cost";
import { getAgentById, recordUsage } from "@/db";
import { REALTIME_MODEL } from "@/lib/realtime";

const logger = createLogger("Sessions End API");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type TranscriptContent = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractTranscriptText(content: unknown): string {
  if (!Array.isArray(content)) {
    return "";
  }

  for (const part of content) {
    if (!isRecord(part)) {
      continue;
    }
    const transcript = part.transcript;
    if (typeof transcript === "string" && transcript.trim()) {
      return transcript;
    }
    const text = part.text;
    if (typeof text === "string" && text.trim()) {
      return text;
    }
  }

  return "";
}

function hasConversationTranscript(items: TranscriptItem[] | undefined) {
  return (
    Array.isArray(items) &&
    items.some((item) => item.role === "user" || item.role === "assistant")
  );
}

async function deriveTranscriptItemsFromEvents(
  sessionId: string
): Promise<TranscriptItem[]> {
  const result = await sql`
    SELECT event_name, event_data, timestamp
    FROM events
    WHERE session_id = ${sessionId}
      AND event_name IN (
        'conversation.item.done',
        'conversation.item.input_audio_transcription.completed',
        'response.output_audio_transcript.done'
      )
    ORDER BY timestamp ASC
  `;

  const items = new Map<string, TranscriptItem>();

  for (const row of result.rows) {
    const eventName = row.event_name as string;
    const eventData = row.event_data as unknown;
    if (!isRecord(eventData)) {
      continue;
    }

    let itemId: unknown;
    let role: TranscriptItem["role"] | undefined;
    let content: TranscriptContent | undefined;

    if (eventName === "conversation.item.done" && isRecord(eventData.item)) {
      const item = eventData.item;
      itemId = item.id;
      const itemRole = item.role;
      if (itemRole !== "user" && itemRole !== "assistant") {
        continue;
      }

      const text = extractTranscriptText(item.content);
      if (!text.trim()) {
        continue;
      }

      role = itemRole;
      content = { type: "text", text };
    } else if (
      eventName === "conversation.item.input_audio_transcription.completed"
    ) {
      itemId = eventData.item_id;
      const transcript = eventData.transcript;
      if (typeof transcript !== "string" || !transcript.trim()) {
        continue;
      }

      role = "user";
      content = { type: "text", text: transcript };
    } else if (eventName === "response.output_audio_transcript.done") {
      itemId = eventData.item_id;
      const transcript = eventData.transcript;
      if (typeof transcript !== "string" || !transcript.trim()) {
        continue;
      }

      role = "assistant";
      content = { type: "text", text: transcript };
    }

    if (typeof itemId !== "string" || !role || !content) {
      continue;
    }

    items.set(itemId, {
      itemId,
      role,
      content,
      timestamp: new Date(row.timestamp).toISOString(),
    });
  }

  return Array.from(items.values());
}

async function logTranscriptItems(
  sessionId: string,
  transcriptItems: TranscriptItem[] | undefined
) {
  if (!Array.isArray(transcriptItems)) {
    return;
  }

  const itemsToLog = transcriptItems.filter(
    (item: TranscriptItem) =>
      !(
        item.role === "user" &&
        item.content.type === "text" &&
        ((item.content as any).text.trim() == "" ||
          (item.content as any).text.includes("Transcribing"))
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

async function backfillTranscriptFromEventsIfNeeded(sessionId: string) {
  const existingTranscript = await sql`
    SELECT COUNT(*) FILTER (WHERE role IN ('user', 'assistant'))::int as conversation_count
    FROM transcript_items
    WHERE session_id = ${sessionId}
  `;

  if (existingTranscript.rows[0]?.conversation_count > 0) {
    return;
  }

  const derivedItems = await deriveTranscriptItemsFromEvents(sessionId);
  if (derivedItems.length > 0) {
    await logTranscriptItems(sessionId, derivedItems);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { sessionId, transcriptItems, agentId: requestAgentId } =
      await request.json();
    const providedAgentId =
      typeof requestAgentId === "string" ? requestAgentId : null;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400, headers: corsHeaders }
      );
    }

    await sql`
      INSERT INTO sessions (session_id, agent_id)
      VALUES (${sessionId}, ${providedAgentId})
      ON CONFLICT (session_id)
      DO UPDATE SET
        agent_id = COALESCE(sessions.agent_id, EXCLUDED.agent_id)
    `;

    // Check if the session already exists and has been ended
    const sessionCheck = await sql`
      SELECT ended_at, agent_id FROM sessions WHERE session_id = ${sessionId}
    `;

    // If session is already ended, don't process it again
    if (sessionCheck.rows.length > 0 && sessionCheck.rows[0].ended_at) {
      logger.info(`Session ${sessionId} already ended, skipping processing`);
      await backfillTranscriptFromEventsIfNeeded(sessionId);
      return NextResponse.json(
        { success: true, status: "already_ended" },
        { headers: corsHeaders }
      );
    }

    const agentId =
      sessionCheck.rows.length > 0 ? sessionCheck.rows[0].agent_id : null;

    // Calculate the total cost for the session using the recorded model value when present.
    const modelResult = await sql`
      SELECT event_data->'session'->>'model' as model
      FROM events 
      WHERE session_id = ${sessionId}
        AND event_name = 'session.created'
      LIMIT 1
    `;

    const model = modelResult.rows[0]?.model || REALTIME_MODEL;
    if (!modelResult.rows[0]?.model) {
      logger.info(
        `Model not found in events for session ${sessionId}, defaulting to ${REALTIME_MODEL}`
      );
    }

    // Get token usage data from response.done events
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

    const usageData = result.rows[0]?.usage_data || [];

    // Check if we have valid usage data
    const hasValidUsageData =
      usageData.length > 0 && usageData.some((data: any) => data !== null);

    let totalStats, costs, totalCost;

    if (hasValidUsageData) {
      // Process usage data and calculate costs
      totalStats = processUsageData(usageData);
      const costResult = calculateCosts(totalStats);
      costs = costResult.costs;
      totalCost = costResult.totalCost;
    } else {
      // No valid usage data found, use default values
      logger.warn(
        `No valid usage data found for session ${sessionId}, using default values`
      );
      totalStats = DEFAULT_COST_DATA.usage;
      costs = DEFAULT_COST_DATA.costs;
      totalCost = 0;

      // Try to estimate usage from other events if possible
      const messageEvents = await sql`
        SELECT COUNT(*) as message_count
        FROM events 
        WHERE session_id = ${sessionId}
          AND event_name IN ('message.created', 'message.received')
      `;

      if (messageEvents.rows[0]?.message_count > 0) {
        const messageCount = parseInt(messageEvents.rows[0].message_count);
        // Very rough estimation - assume average token usage per message
        const estimatedTokens = messageCount * 100;

        totalCost = estimatedTokens * 0.00001; // $0.01 per 1000 tokens rough estimate

        logger.info(
          `Estimated cost for session ${sessionId} based on ${messageCount} messages: $${totalCost.toFixed(
            6
          )}`
        );
      }
    }

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

    // Record the usage cost in the user's budget if we have an agent ID
    if (agentId) {
      try {
        const agent = await getAgentById(agentId);
        if (agent && agent.userId) {
          // Record the usage cost
          const usageResult = await recordUsage(agent.userId, totalCost);

          if (!usageResult.success) {
            logger.warn(
              `Failed to record usage for user ${agent.userId}: ${usageResult.message}`
            );
          } else {
            logger.info(
              `Recorded usage of $${totalCost.toFixed(6)} for user ${agent.userId
              }`
            );
          }
        }
      } catch (error) {
        logger.error("Error recording usage:", error);
        // Continue with the session end process even if recording usage fails
      }
    }

    const incomingTranscriptItems = Array.isArray(transcriptItems)
      ? (transcriptItems as TranscriptItem[])
      : undefined;
    const derivedTranscriptItems = hasConversationTranscript(
      incomingTranscriptItems
    )
      ? []
      : await deriveTranscriptItemsFromEvents(sessionId);

    await logTranscriptItems(sessionId, [
      ...(incomingTranscriptItems ?? []),
      ...derivedTranscriptItems,
    ]);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    logger.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500, headers: corsHeaders }
    );
  }
}
