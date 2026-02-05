import { TokenUsage, TokenCosts } from "@/types/cost";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Cost Calculation");

export const COST_PER_1M_TOKENS = {
  // Pricing buckets map to gpt-realtime (PRO) and gpt-realtime-mini (BASE).
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

/**
 * Calculate costs based on token usage and model type
 * @param usage Token usage statistics
 * @param isPro Whether the model is a Pro model
 * @returns Object containing individual costs and total cost
 */
export function calculateCosts(
  usage: TokenUsage,
  isPro: boolean
): { costs: TokenCosts; totalCost: number } {
  const pricing = isPro ? COST_PER_1M_TOKENS.PRO : COST_PER_1M_TOKENS.BASE;

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
