import { AgentConfig, Tool } from "./types";

const browserActions: Record<string, Tool> = {
  goToUrlTool: {
    type: "function",
    name: "go_to_url",
    description: "Navigate to URL on a new tab",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to navigate to",
        },
      },
      required: ["url"],
    },
  } as Tool,

  searchGoogleTool: {
    type: "function",
    name: "search_google",
    description:
      "Search the query with Google on a new tab. The query should be a search query such as the ones humans search with on Google, concrete and not vague or super long.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to use",
        },
      },
      required: ["query"],
    },
  } as Tool,

  goBackTool: {
    type: "function",
    name: "go_back",
    description: "Go back to the previous page on the current tab",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  } as Tool,

  clickElementTool: {
    type: "function",
    name: "click_element",
    description: "Click an element on the page",
    parameters: {
      type: "object",
      properties: {
        index: {
          type: "number",
          description: "The index of the element to click",
        },
      },
      required: ["index"],
    },
  } as Tool,

  inputTextTool: {
    type: "function",
    name: "input_text",
    description: "Input text into an interactive element",
    parameters: {
      type: "object",
      properties: {
        index: {
          type: "number",
          description: "The index of the element to input text into",
        },
        text: {
          type: "string",
          description: "The text to input",
        },
      },
      required: ["index", "text"],
    },
  } as Tool,

  scrollTool: {
    type: "function",
    name: "scroll",
    description:
      "Scroll the page by a specified amount of pixels. If no amount specified, scrolls one page.",
    parameters: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["up", "down"],
          description: "Direction to scroll",
        },
        amount: {
          type: "number",
          description: "Amount of pixels to scroll (optional)",
        },
      },
      required: ["direction"],
    },
  } as Tool,

  sendKeysTool: {
    type: "function",
    name: "send_keys",
    description:
      "Send keyboard keys or shortcuts. Supports special keys like Backspace, Enter and shortcuts like Control+o",
    parameters: {
      type: "object",
      properties: {
        keys: {
          type: "string",
          description: "The keys to send (e.g. 'Enter', 'Control+o')",
        },
      },
      required: ["keys"],
    },
  } as Tool,

  selectDropdownOptionTool: {
    type: "function",
    name: "select_dropdown_option",
    description: "Select an option from a dropdown menu by its text",
    parameters: {
      type: "object",
      properties: {
        index: {
          type: "number",
          description: "The index of the dropdown element",
        },
        text: {
          type: "string",
          description: "The exact text of the option to select",
        },
      },
      required: ["index", "text"],
    },
  } as Tool,
};

// Helper function to get tool schema
export function getBrowserAction(name: string): Tool {
  if (!browserActions[name]) {
    throw new Error(`Action ${name} not found`);
  }
  return browserActions[name];
}

// Helper function to get all tool schemas
function getAllBrowserActions(): Tool[] {
  return Object.values(browserActions);
}

// Helper function to inject browser actions into agent config
export function injectBrowserActions(
  agentDef: AgentConfig,
  actions: string | string[] = "minimal"
): AgentConfig {
  if (!agentDef.tools) {
    agentDef.tools = [];
  }

  if (actions === "all") {
    agentDef.tools.push(...getAllBrowserActions());
  } else if (actions === "minimal") {
    agentDef.tools.push(getBrowserAction("goToUrlTool"));
  } else if (Array.isArray(actions)) {
    actions.forEach((action) => {
      agentDef.tools.push(getBrowserAction(action));
    });
  } else {
    throw new Error("Invalid actions value");
  }

  return agentDef;
}
