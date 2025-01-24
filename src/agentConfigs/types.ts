import { AgentConfig, Tool } from "@audentic/react";

export interface CreateAgentInput extends Omit<AgentConfig, "id" | "userId"> {
  name: string;
  instructions: string;
  firstMessage?: string;
  language?: string;
  tools: Tool[];
  toolLogic?: AgentConfig["toolLogic"];
  downstreamAgents?: AgentConfig["downstreamAgents"];
}
