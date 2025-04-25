import { Agent } from "../types/agent.js";

export let agentTools: Record<string, any> = {};
export let agentToolsListeners: Record<string, any> = {};

export const loadTools = async (agent: Agent) => {
  try {
    const { mcps, tools } = agent;

    await Promise.all(
      mcps.map(async (mcp) => {
        const { runPlugin, getTools, eventEmitter } = await import(
          `../mcpPlugins/${mcp}.js`
        );
        await runPlugin?.(agent);
        agentTools = { ...agentTools, ...(await getTools()) };
        if (eventEmitter) {
          agentToolsListeners[mcp] = eventEmitter;
        }
      })
    );

    await Promise.all(
      tools.map(async (tool) => {
        const { startTool, getTools } = await import(`../tools/${tool}.js`);
        await startTool?.(agent);
        agentTools = { ...agentTools, ...(await getTools()) };
      })
    );
  } catch (error) {
    console.error("Error loading tools:", error);
  }
};
