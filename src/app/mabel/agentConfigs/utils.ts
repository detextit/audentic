import { AgentConfig, Tool } from "../types";

export function injectDefaultTools(agentDef: AgentConfig): AgentConfig {
  
  // Create the end_conversation tool specific to this agent
  const endConversationTool: Tool = {
    type: "function",
    name: "end_conversation",
    description: `Triggers a call hang up with the user. Use this function to end the conversation when the user does not need any more assistance. Initiate this function after saying "Goodbye!".`,
  };

    // Ensure the agent has a tools array
    if (!agentDef.tools) {
      agentDef.tools = [];
    }

  // Add the newly created tool to the current agent's tools
  agentDef.tools.push(endConversationTool);

  return agentDef;
}
