export type RealtimeModel =
  | "gpt-realtime-2"
  | "gpt-realtime-1.5"
  | "gpt-realtime"
  | "gpt-realtime-mini"
  | (string & {});

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

export const STANDARD_REALTIME_MODEL =
  "gpt-realtime-1.5" satisfies RealtimeModel;
export const ADVANCED_REALTIME_MODEL = "gpt-realtime-2" satisfies RealtimeModel;
export const LEGACY_MINI_REALTIME_MODEL =
  "gpt-realtime-mini" satisfies RealtimeModel;
export const DEFAULT_REALTIME_REASONING_EFFORT: RealtimeReasoningEffort = "low";

export const getAgentRealtimeModel = (isAdvancedModel?: boolean) =>
  isAdvancedModel ? ADVANCED_REALTIME_MODEL : STANDARD_REALTIME_MODEL;

export const getRealtimeSessionSettings = (
  model: RealtimeModel
): RealtimeSessionSettings => {
  const isRealtime2 = String(model).startsWith(ADVANCED_REALTIME_MODEL);

  return {
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
    reasoning: isRealtime2
      ? {
          effort: DEFAULT_REALTIME_REASONING_EFFORT,
        }
      : undefined,
    truncation: {
      type: "retention_ratio",
      retention_ratio: 0.8,
      token_limits: {
        post_instructions: 8000,
      },
    },
    parallelToolCalls: isRealtime2,
    maxOutputTokens: 4096,
  };
};

export const normalizeRealtimeModel = (model: string | null | undefined) =>
  model || LEGACY_MINI_REALTIME_MODEL;

export const isAdvancedRealtimeModel = (model: string | null | undefined) => {
  const normalized = normalizeRealtimeModel(model).toLowerCase();
  if (normalized.includes("mini")) return false;
  return (
    normalized === "gpt-realtime" ||
    normalized.startsWith("gpt-realtime-1.5") ||
    normalized.startsWith("gpt-realtime-2") ||
    normalized.startsWith("gpt-4o-realtime")
  );
};
