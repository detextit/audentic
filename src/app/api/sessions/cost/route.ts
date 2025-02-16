import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

const COST_PER_1M_TOKENS = {
  PRO: {
    TEXT: {
      input: 5.0,
      cached_input: 2.5,
      output: 20.0,
    },
    AUDIO: {
      input: 40.0,
      cached_input: 2.5,
      output: 80.0,
    },
  },
  BASE: {
    TEXT: {
      input: 0.6,
      cached_input: 0.3,
      output: 2.4,
    },
    AUDIO: {
      input: 10.0,
      cached_input: 0.3,
      output: 20.0,
    },
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    // First get the model type from session.created event
    const modelResult = await sql`
      SELECT event_data->'session'->>'model' as model
      FROM events 
      WHERE session_id = ${sessionId}
        AND event_name = 'session.created'
      LIMIT 1
    `;

    const model = modelResult.rows[0]?.model;
    const isPro = model === "gpt-4o-realtime-preview";
    const pricing = isPro ? COST_PER_1M_TOKENS.PRO : COST_PER_1M_TOKENS.BASE;

    // Rest of the token usage query
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

    const usageData = result.rows[0].usage_data || [];

    // Initialize counters
    const totalStats = {
      text: {
        uncached_input: 0,
        cached_input: 0,
        output: 0,
      },
      audio: {
        uncached_input: 0,
        cached_input: 0,
        output: 0,
      },
    };

    // Process each response.done event
    usageData.forEach((usage: any) => {
      if (!usage) return;

      const inputDetails = usage.input_token_details || {};
      const outputDetails = usage.output_token_details || {};
      const cachedDetails = inputDetails.cached_tokens_details || {};

      // Text tokens
      const totalTextInput = inputDetails.text_tokens || 0;
      const cachedTextInput = cachedDetails.text_tokens || 0;
      const uncachedTextInput = totalTextInput - cachedTextInput;

      // Audio tokens
      const totalAudioInput = inputDetails.audio_tokens || 0;
      const cachedAudioInput = cachedDetails.audio_tokens || 0;
      const uncachedAudioInput = totalAudioInput - cachedAudioInput;

      // Accumulate stats
      totalStats.text.uncached_input += uncachedTextInput;
      totalStats.text.cached_input += cachedTextInput;
      totalStats.text.output += outputDetails.text_tokens || 0;

      totalStats.audio.uncached_input += uncachedAudioInput;
      totalStats.audio.cached_input += cachedAudioInput;
      totalStats.audio.output += outputDetails.audio_tokens || 0;
    });

    // Calculate costs using the appropriate pricing
    const costs = {
      text_uncached_input:
        (totalStats.text.uncached_input * pricing.TEXT.input) / 1_000_000,
      text_cached_input:
        (totalStats.text.cached_input * pricing.TEXT.cached_input) / 1_000_000,
      text_output: (totalStats.text.output * pricing.TEXT.output) / 1_000_000,

      audio_uncached_input:
        (totalStats.audio.uncached_input * pricing.AUDIO.input) / 1_000_000,
      audio_cached_input:
        (totalStats.audio.cached_input * pricing.AUDIO.cached_input) /
        1_000_000,
      audio_output:
        (totalStats.audio.output * pricing.AUDIO.output) / 1_000_000,
    };

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    return NextResponse.json({
      usage: totalStats,
      costs: {
        ...costs,
        total: totalCost,
      },
      isPro,
    });
  } catch (error) {
    console.error("Error calculating session cost:", error);
    return NextResponse.json(
      { error: "Failed to calculate session cost" },
      { status: 500 }
    );
  }
}
