export interface MCPServerDefinition {
  displayName: string;
  description: string;
  icon: string;
  command: string;
  args: string[];
  envVars?: Array<{
    name: string;
    description: string;
    required: boolean;
    default?: string;
  }>;
  defaultEnv?: Record<string, string>;
}

export const AVAILABLE_MCP_SERVERS: Record<string, MCPServerDefinition> = {
  "mcp-server-esignatures": {
    displayName: "E-Signatures",
    description: "Integration for handling electronic signatures",
    icon: "✍️",
    command: "/home/info_detextit/.local/bin/uv",
    args: [
      "--directory",
      "/home/info_detextit/app/mcp-server-esignatures",
      "run",
      "mcp-server-esignatures",
    ],
    envVars: [
      {
        name: "ESIGNATURES_SECRET_TOKEN",
        description: "API token for e-signature service",
        required: true,
      },
    ],
  },
  // prettier-ignore
  "puppeteer": {
    displayName: "Puppeteer",
    description: "Integration for Puppeteer",
    icon: "🎭",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
  },
  "brave-search": {
    displayName: "Brave Search",
    description: "Integration for Brave Search",
    icon: "🔍",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    envVars: [
      {
        name: "BRAVE_API_KEY",
        description: "API key for Brave Search",
        required: true,
      },
    ],
    defaultEnv: {
      PATH: "/usr/bin",
    },
  },
  "google-maps": {
    displayName: "Google Maps",
    description: "Integration for Google Maps",
    icon: "🗺️",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-google-maps"],
    envVars: [
      {
        name: "GOOGLE_MAPS_API_KEY",
        description: "API key for Google Maps",
        required: true,
      },
    ],
    defaultEnv: {
      PATH: "/usr/bin",
    },
  },
  // prettier-ignore
  "memory": {
    displayName: "Memory",
    description: "Integration for Memory",
    icon: "🧠",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    defaultEnv: {
      MEMORY_FILE_PATH: "/home/info_detextit/server-memory/${agentId}/memory.json",
      PATH: "/usr/bin",
    },
  },
  // "sequential-thinking": {
  //   displayName: "Sequential Thinking",
  //   description: "Integration for dynamic and reflective problem-solving",
  //   icon: "🔗",
  //   command: "npx",
  //   args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
  //   defaultEnv: {
  //     PATH: "/usr/bin",
  //   },
  // },
  // prettier-ignore
  // "everything": {
  //   displayName: "Everything",
  //   description: "Integration for Testing",
  //   icon: "🔬",
  //   command: "npx",
  //   args: ["-y", "@modelcontextprotocol/server-everything"],
  //   defaultEnv: {
  //     PATH: "/usr/bin",
  //   },
  // },
};
