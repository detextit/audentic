import { AllAgentConfigsType } from "@voiceact/mabel/types";
import { createVoiceActAgent } from "./voiceAct";
import { AgentConfig } from "@voiceact/mabel/types";

// This will store the loaded agents for the current session
let loadedAgents: Record<string, AgentConfig> = {};

export function loadAgentConfigs(agents: AgentConfig[]): void {
  loadedAgents = agents.reduce(
    (acc, agent) => ({
      ...acc,
      [agent.id]: agent,
    }),
    {}
  );
}

export function getAgentConfig(agentId: string): AgentConfig | undefined {
  return loadedAgents[agentId];
}

export const defaultAgentSets: AllAgentConfigsType = {
  voiceAct: [createVoiceActAgent()],
};
