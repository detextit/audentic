import { AgentConfig, Tool } from "../types";

export function injectDefaultTools(agentDef: AgentConfig): AgentConfig {
  
  // Create the end_conversation tool specific to this agent
  const endConversationTool: Tool = {
    type: "function",
    name: "end_conversation",
    description: `Use this tool to end the conversation with the user. Be polite and inform the user before using this function to end the conversation.`,
    parameters: {
      type: "object",
      properties: {
        conversation_context: {
          type: "string",
          description:
            "Relevant context from the conversation that will help the recipient perform the correct action.",
        },
      },
      required: [
        "conversation_context",
      ],
      strict: true,
    },
  };


    // Ensure the agent has a tools array
    if (!agentDef.tools) {
      agentDef.tools = [];
    }

  // Add the newly created tool to the current agent's tools
  agentDef.tools.push(endConversationTool);

  return agentDef;
}
