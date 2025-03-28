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
    command: "/home/audentic_io/.local/bin/uv",
    args: [
      "--directory",
      "/home/audentic_io/app/mcp-server-esignatures",
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
    command: "node",
    args: [ "/home/audentic_io/app/servers/src/puppeteer/dist/index.js"],
    defaultEnv: {
      PATH: "/usr/bin",
    },
  },
  "brave-search": {
    displayName: "Brave Search",
    description: "Integration for Brave Search",
    icon: "🔍",
    command: "node",
    args: ["/home/audentic_io/app/servers/src/brave-search/dist/index.js"],
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
    command: "node",
    args: ["/home/audentic_io/app/servers/src/google-maps/dist/index.js"],
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
    command: "node",
    args: [ "/home/audentic_io/app/servers/src/memory/dist/index.js"],
    defaultEnv: {
      MEMORY_FILE_PATH: "/home/audentic_io/server-memory/${agentId}/memory.json",
      PATH: "/usr/bin",
    },
  },
  "aws-kb-retrieval": {
    displayName: "AWS Knowledge Base",
    description: "Integration for AWS Knowledge Base Retrieval",
    icon: "🗃️",
    command: "node",
    args: ["/home/audentic_io/app/servers/src/aws-kb-retrieval/dist/index.js"],
    envVars: [
      {
        name: "AWS_ACCESS_KEY_ID",
        description: "AWS Access Key ID",
        required: true,
      },
      {
        name: "AWS_SECRET_ACCESS_KEY",
        description: "AWS Secret Access Key",
        required: true,
      },
      {
        name: "AWS_REGION",
        description: "AWS Region",
        required: true,
      },
    ],
    defaultEnv: {
      PATH: "/usr/bin",
    },
  },
  stagehand: {
    displayName: "Stagehand",
    description: "Integration for Stagehand - Browserbase",
    icon: "🤘",
    command: "node",
    args: [
      "/home/audentic_io/app/mcp-server-browserbase/stagehand/dist/index.js",
    ],
    envVars: [
      {
        name: "BROWSERBASE_API_KEY",
        description: "Browserbase API Key",
        required: true,
      },
      {
        name: "BROWSERBASE_PROJECT_ID",
        description: "Browserbase Project ID",
        required: true,
      },
      {
        name: "OPENAI_API_KEY",
        description: "OpenAI API Key",
        required: true,
      },
    ],
    defaultEnv: {
      PATH: "/usr/bin",
    },
  },
  "browserbase": {
    displayName: "Browserbase",
    description: "Integration for Browserbase",
    icon: "🅱️",
    command: "node",
    args: [
      "/home/audentic_io/app/mcp-server-browserbase/browserbase/dist/index.js",
    ],
    envVars: [
      {
        name: "BROWSERBASE_API_KEY",
        description: "Browserbase API Key",
        required: true,
      },
      {
        name: "BROWSERBASE_PROJECT_ID",
        description: "Browserbase Project ID",
        required: true,
      },
    ],
    defaultEnv: {
      PATH: "/usr/bin",
    },
  },

  // "sequential-thinking": {
  //   displayName: "Sequential Thinking",
  //   description: "Integration for dynamic and reflective problem-solving",
  //   icon: "🔗",
  //   command: "node",
  //   args: [ "/home/audentic_io/app/servers/src/sequential-thinking"],
  //   defaultEnv: {
  //     PATH: "/usr/bin",
  //   },
  // },
  // prettier-ignore
  // "everything": {
  //   displayName: "Everything",
  //   description: "Integration for Testing",
  //   icon: "🔬",
  //   command: "node",
  //   args: [ "/home/audentic_io/app/servers/src/everything"],
  //   defaultEnv: {
  //     PATH: "/usr/bin",
  //   },
  // },
};
