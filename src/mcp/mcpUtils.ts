import type { MCPServers } from "./mcp";

/**
 * Check connection status for a server
 * @param serverName Name of the MCP server to check
 * @returns Connection status object
 */
export async function checkServerStatus(
  serverName: string,
  baseUrl: string = process.env.MCP_SERVER_URL || "http://localhost:8080"
): Promise<{
  connected: boolean;
  state: string;
  error?: string;
}> {
  const response = await fetch(
    `${baseUrl}/status/${encodeURIComponent(serverName)}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * List available tools for a server
 * @param serverName Name of the MCP server
 * @returns Array of available tools in OpenAI format
 */
export async function listTools(
  serverName: string,
  baseUrl: string = process.env.MCP_SERVER_URL || "http://localhost:8080"
): Promise<
  Array<{
    type: "function";
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  }>
> {
  const response = await fetch(
    `${baseUrl}/tools/${encodeURIComponent(serverName)}`
  );
  const data = await response.json();

  // Transform Claude format to OpenAI format
  return data.tools.map(
    (tool: {
      name: string;
      description: string;
      inputSchema?: {
        type: string;
        properties: Record<string, unknown>;
        required?: string[];
      };
    }) => ({
      type: "function",
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.inputSchema?.properties || {},
        ...(tool.inputSchema?.required && {
          required: tool.inputSchema.required,
        }),
      },
    })
  );
}

/**
 * Execute a tool on a server
 * @param serverName Name of the MCP server
 * @param toolName Name of the tool to execute
 * @param args Arguments for the tool
 * @returns Tool execution result
 */
export async function executeTool<T = unknown>(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
  baseUrl: string = process.env.MCP_SERVER_URL || "http://localhost:8080"
): Promise<T> {
  const response = await fetch(
    `${baseUrl}/${encodeURIComponent(serverName)}/execute/${encodeURIComponent(
      toolName
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      error.message || `Tool execution failed: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Configure MCP servers (admin endpoint)
 * @param servers Configuration object for MCP servers
 * @returns Success status
 */
export async function configureServers(
  servers: MCPServers,
  baseUrl: string = process.env.MCP_SERVER_URL || "http://localhost:8080"
): Promise<{ success: boolean }> {
  const response = await fetch(`${baseUrl}/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(servers),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      error.details || `Configuration failed: ${response.status}`
    );
  }

  return response.json();
}
