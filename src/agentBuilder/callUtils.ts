import { AgentConfig, Tool } from "./types";

// Create the end_conversation tool specific to this agent
const endConversationTool = {
  type: "function",
  name: "end_conversation",
  description: `Ends the current conversation with a summary of the conversation. 
      - Use this tool when the user signals hangup/end conversation or when the agent task is complete.
      - Returns: { rationale_for_hangup: string, conversation_summary: string } containing the summary of the conversation`,
  parameters: {
    type: "object",
    properties: {
      rationale_for_hangup: {
        type: "string",
        description: "Reason for ending the conversation",
        enum: ["user_requested", "task_complete"],
      },
      conversation_summary: {
        type: "string",
        description:
          "Summary of the conversation. Extract key points pertaining to the agent task.",
      },
    },
    required: ["rationale_for_hangup", "conversation_summary"],
  },
} as Tool;

export function injectCallTools(agentDef: AgentConfig): AgentConfig {
  if (!agentDef.tools) {
    agentDef.tools = [];
  }
  agentDef.tools.push(endConversationTool);
  return agentDef;
}
