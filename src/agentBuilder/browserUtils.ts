import { AgentConfig, Tool } from "@/types/agent";

const browserAPITools: Record<string, Tool> = {
  copyFromClipboardTool: {
    type: "function",
    name: "copy_from_clipboard",
    description: `Copies text from the user's clipboard. 
    - Use this tool when explicitly asked by the user to read clipboard content
    - Requires 'clipboard-read' permission from the browser
    - Always inform the user before attempting to read from clipboard
    - Handle potential errors:
      * Permission denied: Guide user to enable clipboard permissions
      * Unsupported browser: Inform user that the browser does not support clipboard access
      * Empty clipboard: Inform user if no content is available
    - Returns: { text: string } containing the clipboard content`,
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  } as Tool,

  setToClipboardTool: {
    type: "function",
    name: "set_to_clipboard",
    description: `Sets text to the user's clipboard. 
    - Use this tool when you need to provide text that the user might want to copy/paste
    - Requires 'clipboard-write' permission from the browser
    - Always inform the user before and after copying text to clipboard
    - Best practices:
      * Confirm success with user
      * Provide a summary of the text being copied in the message
      * Suggest next steps after copying
    - Handle potential errors:
      * Permission denied: Guide user to enable clipboard permissions
      * Unsupported browser: Show text to manually copy instead
    - Returns: { success: true } when text is successfully copied`,
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description:
            "The text to set to clipboard. Must be a non-empty string.",
        },
      },
      required: ["text"],
    },
  } as Tool,

  // Example of how to add a new browser API tool:
  /*
  getLocationTool: {
    type: "function",
    name: "get_location",
    description: `Gets the user's current geolocation. 
    - Use this tool when location information is explicitly requested
    - Requires 'geolocation' permission from the browser
    - Always inform user before requesting location
    - Handle potential errors:
      * Permission denied: Guide user to enable location services
      * Unsupported browser: Suggest alternative methods
      * Location unavailable: Inform user if location can't be determined
    - Returns: { latitude: number, longitude: number }`,
    parameters: {
      type: "object",
      properties: {},
    },
    errors: [
      "PERMISSION_DENIED: User needs to grant location access",
      "API_NOT_SUPPORTED: Browser doesn't support geolocation",
      "OPERATION_FAILED: Failed to get location",
    ],
  } as Tool,
  */
};

// Helper function to get tool schema
function getBrowserAPITool(name: string): Tool {
  if (!browserAPITools[name]) {
    throw new Error(`Tool ${name} not found`);
  }
  return browserAPITools[name];
}

// Helper function to get all tool schemas
function getAllBrowserAPITools(): Tool[] {
  return Object.keys(browserAPITools).map((key) => browserAPITools[key]);
}

export function injectBrowserTools(
  agentDef: AgentConfig,
  browserTools: string | string[] = "all"
): AgentConfig {
  // Ensure the agent has a tools array
  if (!agentDef.tools) {
    agentDef.tools = [];
  }

  if (browserTools === "all") {
    agentDef.tools.push(...getAllBrowserAPITools());
  } else if (Array.isArray(browserTools)) {
    browserTools.forEach((tool) => {
      agentDef.tools.push(getBrowserAPITool(tool));
    });
  } else {
    throw new Error("Invalid browserTools value");
  }

  return agentDef;
}
