export interface MCPServerDefinition {
  displayName: string;
  description: string;
  icon: string;
  command: string;
  args: string[];
  envVars: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
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
  // Add other MCP servers here
};
