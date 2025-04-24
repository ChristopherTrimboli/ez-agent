import { Agent } from "../types/agent.js";

export let agentTools: Record<string, any> = {};
export let agentToolsListeners: Record<string, any> = {};

export const loadTools = async (agent: Agent) => {
  try {
    const { mcps, tools } = agent;

    for (const mcp of mcps) {
      const { runPlugin, getTools, eventEmitter } = await import(
        `../mcpPlugins/${mcp}.js`
      );
      await runPlugin?.(agent);
      const tools = await getTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
      if (eventEmitter) {
        agentToolsListeners[mcp] = eventEmitter;
      }
    }

    for (const tool of tools) {
      const { startTool, getTools } = await import(`../tools/${tool}.js`);
      await startTool?.(agent);
      const tools = await getTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
  } catch (error) {
    console.error("Error loading tools:", error);
  }
};
