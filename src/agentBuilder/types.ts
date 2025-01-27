import { AgentConfig, Tool } from "@audentic/react";

export interface CreateAgentInput extends Omit<AgentConfig, "id" | "userId"> {
  name: string;
  description: string;
  personality?: string;
  initiateConversation: boolean;
  instructions: string;
  tools: Tool[];
  toolLogic?: AgentConfig["toolLogic"];
}
