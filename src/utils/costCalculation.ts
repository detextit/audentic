import { TokenUsage, TokenCosts } from "@/types/cost";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Cost Calculation");

export const COST_PER_1M_TOKENS = {
  REALTIME_2: {
    TEXT: {
      input: 4.0,
      cached_input: 0.4,
      output: 24.0,
    },
    AUDIO: {
      input: 32.0,
      cached_input: 0.4,
      output: 64.0,
    },
  },
  REALTIME_1_5: {
    TEXT: {
      input: 4.0,
      cached_input: 0.4,
      output: 16.0,
    },
    AUDIO: {
      input: 32.0,
      cached_input: 0.4,
      output: 64.0,
    },
  },
  REALTIME_MINI: {
    TEXT: {
      input: 0.6,
      cached_input: 0.06,
      output: 2.4,
    },
    AUDIO: {
      input: 10.0,
      cached_input: 0.3,
      output: 20.0,
    },
  },
};

const resolveRealtimePricing = (modelOrIsPro: string | boolean | null | undefined) => {
  if (typeof modelOrIsPro === "boolean") {
    return modelOrIsPro
      ? COST_PER_1M_TOKENS.REALTIME_2
      : COST_PER_1M_TOKENS.REALTIME_MINI;
  }

  const model = (modelOrIsPro || "").toLowerCase();
  if (model.includes("mini")) {
    return COST_PER_1M_TOKENS.REALTIME_MINI;
  }
  if (model.startsWith("gpt-realtime-2")) {
    return COST_PER_1M_TOKENS.REALTIME_2;
  }
  return COST_PER_1M_TOKENS.REALTIME_1_5;
};

/**
 * Calculate costs based on token usage and model type
 * @param usage Token usage statistics
 * @param isPro Whether the model is a Pro model
 * @returns Object containing individual costs and total cost
 */
export function calculateCosts(
  usage: TokenUsage,
  modelOrIsPro: string | boolean | null | undefined
): { costs: TokenCosts; totalCost: number } {
  const pricing = resolveRealtimePricing(modelOrIsPro);

  const costs: TokenCosts = {
    text_uncached_input:
      (usage.text.uncached_input * pricing.TEXT.input) / 1_000_000,
    text_cached_input:
      (usage.text.cached_input * pricing.TEXT.cached_input) / 1_000_000,
    text_output: (usage.text.output * pricing.TEXT.output) / 1_000_000,

    audio_uncached_input:
      (usage.audio.uncached_input * pricing.AUDIO.input) / 1_000_000,
    audio_cached_input:
      (usage.audio.cached_input * pricing.AUDIO.cached_input) / 1_000_000,
    audio_output: (usage.audio.output * pricing.AUDIO.output) / 1_000_000,
    total: 0, // Will be calculated below
  };

  costs.total =
    Object.values(costs).reduce((sum, cost) => sum + cost, 0) - costs.total; // Subtract total to avoid counting it twice

  const totalCost = costs.total;

  return { costs, totalCost };
}

/**
 * Process usage data from response.done events to calculate token usage
 * @param usageData Array of usage data from response.done events
 * @returns Aggregated token usage statistics
 */
export function processUsageData(usageData: any[]): TokenUsage {
  const totalStats: TokenUsage = {
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

    logger.debug("Processing usage data:", JSON.stringify(usage, null, 2));

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

  logger.debug("Final token usage stats:", JSON.stringify(totalStats, null, 2));
  return totalStats;
}
