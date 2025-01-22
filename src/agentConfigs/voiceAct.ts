import { AgentConfig } from "@voiceact/mabel/types";
import { injectDefaultTools } from "./utils";

// Define default template agent
export const defaultVoiceActTemplate: AgentConfig = {
  id: "voiceAct",
  userId: "system",
  name: "voiceAct",
  instructions: `You are an AI assistant for VoiceAct, a voice agent building platform. Users of the platform are able to create and embed their own voice agent into websites of their choice. You will respond in English unless requested by the user or if the user initiates a long conversation in a different language.`,
  firstMessage: `Hello! I'm Mabel, a voice assistant for VoiceAct. How can I help you today?`,
  tools: [],
};

// Create a function to generate a new agent config with default tools
export function createVoiceActAgent(
  config: Partial<AgentConfig> = {}
): AgentConfig {
  return injectDefaultTools({
    ...defaultVoiceActTemplate,
    ...config,
  });
}

const agents = [createVoiceActAgent()];

export default agents;
