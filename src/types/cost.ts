/**
 * Token usage statistics for a session
 */
export interface TokenUsage {
  text: {
    uncached_input: number;
    cached_input: number;
    output: number;
  };
  audio: {
    uncached_input: number;
    cached_input: number;
    output: number;
  };
}

/**
 * Cost breakdown for different token types
 */
export interface TokenCosts {
  text_uncached_input: number;
  text_cached_input: number;
  text_output: number;
  audio_uncached_input: number;
  audio_cached_input: number;
  audio_output: number;
  total: number;
}

/**
 * Complete cost data for a session
 */
export interface CostData {
  usage: TokenUsage;
  costs: TokenCosts;
  total_cost: number;
  is_final: boolean;
  isPro: boolean;
}

/**
 * Default empty cost data structure
 */
export const DEFAULT_COST_DATA: CostData = {
  usage: {
    text: { uncached_input: 0, cached_input: 0, output: 0 },
    audio: { uncached_input: 0, cached_input: 0, output: 0 },
  },
  costs: {
    text_uncached_input: 0,
    text_cached_input: 0,
    text_output: 0,
    audio_uncached_input: 0,
    audio_cached_input: 0,
    audio_output: 0,
    total: 0,
  },
  total_cost: 0,
  is_final: false,
  isPro: false,
};
