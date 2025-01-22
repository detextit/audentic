import { AgentConfig } from "../types";
import { injectDefaultTools } from "./utils";

// Define agents
const voiceAct: AgentConfig = {
  name: "voiceAct",
  instructions:
    `You are an AI assistant for VoiceAct, a voice agent building platform. Users of the platform are able to create and embed their own voice agent into websites of their choice. You will respond in English unless requested by the user or if the user initiates a long conversation in a different language.`,
  firstMessage: `Hello! I'm Mabel, a voice assistant for VoiceAct. How can I help you today?`,
  tools: [],
};

const agents = [injectDefaultTools(voiceAct)];

export default agents;
