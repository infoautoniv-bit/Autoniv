import { fetchMcpTools, callMcpTool, MCP_TOOL_PREFIX } from '../services/orchestrator/mcpClient.js';

describe('mcpClient (Model Context Protocol)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('fetches and converts MCP tools to OpenAI function calling format', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        result: {
          tools: [
            {
              name: 'lookupCustomerBalance',
              description: 'Fetch billing balance for customer phone',
              inputSchema: {
                type: 'object',
                properties: {
                  phone: { type: 'string' },
                },
                required: ['phone'],
              },
            },
          ],
        },
      }),
    });

    const tools = await fetchMcpTools('https://mcp.company.internal/rpc');
    expect(tools).toHaveLength(1);
    expect(tools[0].type).toBe('function');
    expect(tools[0].function.name).toBe(`${MCP_TOOL_PREFIX}lookupCustomerBalance`);
    expect(tools[0].function.description).toContain('lookupCustomerBalance');
    expect(tools[0].function.parameters.properties.phone).toBeDefined();
  });

  test('calls remote MCP tool and parses result', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        result: {
          content: [{ type: 'text', text: 'Balance is $45.00' }],
        },
      }),
    });

    const res = await callMcpTool('https://mcp.company.internal/rpc', `${MCP_TOOL_PREFIX}lookupCustomerBalance`, { phone: '+1234567890' });
    expect(res.success).toBe(true);
    expect(res.result[0].text).toBe('Balance is $45.00');
  });

  test('handles network failure or invalid server gracefully', async () => {
    global.fetch = async () => {
      throw new Error('Connection refused');
    };

    const res = await callMcpTool('https://invalid-mcp-server.local', 'getInventory', {});
    expect(res.success).toBe(false);
    expect(res.error).toBe('Connection refused');
  });
});
