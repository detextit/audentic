import { AgentConfig, Tool } from "../types";

export function injectDefaultTools(agentDef: AgentConfig): AgentConfig {
  
  // Create the end_conversation tool specific to this agent
  const endConversationTool: Tool = {
    type: "function",
    name: "end_conversation",
    description: `Triggers a call hang up with the user. Only call this function if the context of the conversation is appropriate. Let the user know you're about to hang up.`,
  };

    // Ensure the agent has a tools array
    if (!agentDef.tools) {
      agentDef.tools = [];
    }

  // Add the newly created tool to the current agent's tools
  agentDef.tools.push(endConversationTool);

  return agentDef;
}
