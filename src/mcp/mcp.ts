import { z } from "zod";

const BaseOptionsSchema = z.object({
  iconPath: z.string().optional(),
});

export type JsonSchemaType = {
  type: "string" | "number" | "boolean" | "array" | "object";
  enum?: string[];
  items?: JsonSchemaType;
  properties?: Record<string, JsonSchemaType>;
  required?: string[];
  description?: string;
};

export const StdioOptionsSchema = BaseOptionsSchema.extend({
  type: z.literal("stdio").optional(),
  /**
   * The executable to run to start the server.
   */
  command: z.string(),
  /**
   * Command line arguments to pass to the executable.
   */
  args: z.array(z.string()),
  /**
   * The environment to use when spawning the process.
   *
   * If not specified, the result of getDefaultEnvironment() will be used.
   */
  env: z.record(z.string(), z.string()).optional(),
  /**
   * How to handle stderr of the child process. This matches the semantics of Node's `child_process.spawn`.
   *
   * @type {import('node:child_process').IOType | import('node:stream').Stream | number}
   *
   * The default is "inherit", meaning messages to stderr will be printed to the parent process's stderr.
   */
  stderr: z.any().optional(),
});

export const WebSocketOptionsSchema = BaseOptionsSchema.extend({
  type: z.literal("websocket").optional(),
  url: z
    .string()
    .url()
    .refine(
      (val) => {
        const protocol = new URL(val).protocol;
        return protocol === "ws:" || protocol === "wss:";
      },
      {
        message: "WebSocket URL must start with ws:// or wss://",
      }
    ),
});

export const SSEOptionsSchema = BaseOptionsSchema.extend({
  type: z.literal("sse").optional(),
  url: z
    .string()
    .url()
    .refine(
      (val) => {
        const protocol = new URL(val).protocol;
        return protocol !== "ws:" && protocol !== "wss:";
      },
      {
        message: "SSE URL must not start with ws:// or wss://",
      }
    ),
});

export const MCPOptionsSchema = z.union([
  StdioOptionsSchema,
  WebSocketOptionsSchema,
  SSEOptionsSchema,
]);

export const MCPServersSchema = z.record(z.string(), MCPOptionsSchema);

export type StdioOptions = z.infer<typeof StdioOptionsSchema>;
export type WebSocketOptions = z.infer<typeof WebSocketOptionsSchema>;
export type SSEOptions = z.infer<typeof SSEOptionsSchema>;
export type MCPOptions = z.infer<typeof MCPOptionsSchema>;
export type MCPServers = z.infer<typeof MCPServersSchema>;
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{ name: string }>;
}

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type ToolContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      data: string;
      mimeType: string;
    }
  | {
      type: "resource";
      resource: {
        uri: string;
        mimeType?: string;
        text?: string;
        blob?: string;
      };
    };
export type ImageContent = Extract<ToolContentPart, { type: "image" }>;
export type MCPToolCallResponse =
  | undefined
  | {
      _meta?: Record<string, unknown>;
      content?: Array<ToolContentPart>;
      isError?: boolean;
    };

export type Provider = "google" | "anthropic" | "openAI";

export type FormattedContent =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      inlineData: {
        mimeType: string;
        data: string;
      };
    }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    };

export type ImageFormatter = (item: ImageContent) => FormattedContent;

export type FormattedToolResponse = [
  string | FormattedContent[],
  { content: FormattedContent[] } | undefined
];

export interface LCTool {
  name: string;
  description?: string;
  parameters: JsonSchemaType;
}

export interface LCFunctionTool {
  type: "function";
  ["function"]: LCTool;
}

export type LCAvailableTools = Record<string, LCFunctionTool>;

export const tPluginAuthConfigSchema = z.object({
  authField: z.string(),
  label: z.string(),
  description: z.string(),
});

export const tPluginSchema = z.object({
  name: z.string(),
  pluginKey: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  authConfig: z.array(tPluginAuthConfigSchema).optional(),
  authenticated: z.boolean().optional(),
  isButton: z.boolean().optional(),
  toolkit: z.boolean().optional(),
});

export type TPlugin = z.infer<typeof tPluginSchema>;

export type LCToolManifest = TPlugin[];
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{ name: string }>;
}
