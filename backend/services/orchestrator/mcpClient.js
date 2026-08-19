/**
 * Model Context Protocol (MCP) Dynamic Tools Client
 *
 * Implements JSON-RPC 2.0 over HTTP/SSE to query external MCP servers
 * and dynamically bind remote tools (CRM, ERP, private databases) to live voice calls.
 */

import { log } from '../logger.js';

export const MCP_TOOL_PREFIX = 'mcp__';

export function isSafeMcpUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') return false;
    if (host === '169.254.169.254' || host === 'metadata.google.internal') return false;
    if (host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.16.')) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches tool definitions from an external MCP server endpoint.
 * Converts MCP tools format to OpenAI Function Calling format.
 */
export async function fetchMcpTools(serverUrl, apiKey = null, timeoutMs = 4000) {
  if (!serverUrl || typeof serverUrl !== 'string' || !isSafeMcpUrl(serverUrl)) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const payload = {
      jsonrpc: '2.0',
      id: `mcp_list_${Date.now()}`,
      method: 'tools/list',
      params: {},
    };

    const response = await fetch(serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      log.warn('mcp_fetch_tools_failed_status', { serverUrl, status: response.status });
      return [];
    }

    const json = await response.json();
    const tools = json.result?.tools || json.tools || [];

    return tools.map(tool => ({
      type: 'function',
      function: {
        name: `${MCP_TOOL_PREFIX}${tool.name}`,
        description: `[MCP Tool: ${tool.name}] ${tool.description || ''}`,
        parameters: tool.inputSchema || {
          type: 'object',
          properties: {},
        },
      },
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    log.warn('mcp_fetch_tools_error', { serverUrl, error: err.message });
    return [];
  }
}

/**
 * Calls an MCP tool on an external MCP server.
 */
export async function callMcpTool(serverUrl, toolName, args = {}, apiKey = null, timeoutMs = 7000) {
  if (!serverUrl || !isSafeMcpUrl(serverUrl)) {
    return { success: false, error: 'Invalid or unauthorized MCP server URL.' };
  }

  const cleanToolName = toolName.startsWith(MCP_TOOL_PREFIX)
    ? toolName.slice(MCP_TOOL_PREFIX.length)
    : toolName;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const payload = {
      jsonrpc: '2.0',
      id: `mcp_call_${Date.now()}`,
      method: 'tools/call',
      params: {
        name: cleanToolName,
        arguments: args,
      },
    };

    const response = await fetch(serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `MCP server error (${response.status}): ${errText}` };
    }

    const json = await response.json();

    if (json.error) {
      return { success: false, error: json.error.message || 'MCP tool execution failed.' };
    }

    const content = json.result?.content || json.content || json.result;
    return {
      success: true,
      result: content,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === 'AbortError' ? 'MCP tool execution timed out.' : err.message,
    };
  }
}
