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
  initiateConversation: boolean;
  instructions: string;
  tools: Tool[];
  toolLogic?: Record<string, any>;
}

export interface AgentDBConfig extends AgentConfig {
  id: string;
  userId: string;
  description: string;
  personality?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
