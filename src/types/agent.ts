interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
  pattern?: string;
  properties?: Record<string, ToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
  items?: ToolParameterProperty;
}

interface ToolParameters {
  type: string;
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
  strict?: boolean;
}

export interface Tool {
  type: "function";
  name: string;
  description: string;
  parameters?: ToolParameters;
}
export interface AgentConfig {
  name: string;
  model?: "gpt-realtime" | "gpt-realtime-mini";
  initiateConversation: boolean;
  instructions: string;
  tools: Tool[];
  toolLogic?: Record<string, string>;
}

export interface AgentDBConfig extends AgentConfig {
  id: string;
  userId: string;
  description: string;
  personality?: string;
  settings?: Record<string, any>;
  webUI?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AgentCreateInput = Omit<
  AgentDBConfig,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Knowledge Base Article type
export interface KnowledgeBaseDBArticle {
  id: string;
  agentId: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface KnowledgeBaseArticle {
  id?: string;
  title: string;
  content?: string;
  updatedAt?: string;
}
