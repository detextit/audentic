import { AgentConfig, Tool } from "@voiceact/mabel/types";

export interface CreateAgentInput extends Omit<AgentConfig, "id" | "userId"> {
    name: string;
    instructions: string;
    firstMessage?: string;
    language?: string;
    tools: Tool[];
    toolLogic?: AgentConfig["toolLogic"];
    downstreamAgents?: AgentConfig["downstreamAgents"];
}