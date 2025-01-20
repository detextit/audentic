import { AgentConfig } from "../types";
import { injectTransferTools } from "./utils";

// Define agents
const haiku: AgentConfig = {
  name: "haiku",
  instructions:
    "Ask the user for a topic, then reply with a haiku about that topic.",
  tools: [],
};

// add the transfer tool to point to downstreamAgents
const agents = injectTransferTools([haiku]);

export default agents;
