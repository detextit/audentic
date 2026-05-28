export type RealtimeModel = "gpt-realtime-2";

export type RealtimeReasoningEffort =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export interface RealtimeSessionSettings {
  audio?: {
    input?: {
      transcription?: {
        model?: string;
        language?: string;
        prompt?: string;
      } | null;
      turnDetection?: Record<string, unknown> | null;
      noiseReduction?: {
        type: "near_field" | "far_field" | (string & {});
      } | null;
    };
    output?: {
      voice?: string;
      speed?: number;
    };
  };
  reasoning?: {
    effort: RealtimeReasoningEffort;
  };
  truncation?: Record<string, unknown> | "auto" | "disabled";
  parallelToolCalls?: boolean;
  maxOutputTokens?: number | "inf";
}

export const REALTIME_MODEL = "gpt-realtime-2" satisfies RealtimeModel;
export const DEFAULT_REALTIME_REASONING_EFFORT: RealtimeReasoningEffort = "low";

export const getAgentRealtimeModel = () => REALTIME_MODEL;

export const getRealtimeSessionSettings = (): RealtimeSessionSettings => ({
  audio: {
    input: {
      transcription: {
        model: "gpt-4o-mini-transcribe",
      },
      turnDetection: {
        type: "semantic_vad",
        eagerness: "auto",
        interrupt_response: true,
      },
      noiseReduction: null,
    },
    output: {
      voice: "alloy",
      speed: 1,
    },
  },
  reasoning: {
    effort: DEFAULT_REALTIME_REASONING_EFFORT,
  },
  truncation: {
    type: "retention_ratio",
    retention_ratio: 0.8,
    token_limits: {
      post_instructions: 8000,
    },
  },
  parallelToolCalls: true,
  maxOutputTokens: 4096,
});

export const normalizeRealtimeModel = (model: string | null | undefined) =>
  model || REALTIME_MODEL;

export const isAdvancedRealtimeModel = () => true;
