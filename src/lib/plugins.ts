import { Agent } from "src/types/agent.js";

export let agentTools: Record<string, any> = {};

export let agentToolsListeners: Record<string, any> = {};

export const loadPlugins = async (agent: Agent) => {
  try {
    const { plugins } = agent;

    if (plugins.includes("discord")) {
      const { runDiscordPlugin, getDiscordTools, discordEventEmitter } =
        await import("../plugins/discord.js");
      await runDiscordPlugin(agent);
      const tools = await getDiscordTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
      agentToolsListeners.discord = discordEventEmitter;
    }
    if (plugins.includes("telegram")) {
      const { telegramTool, startTelegramTool, telegramEventEmitter } =
        await import("../tools/telegram.js");
      await startTelegramTool();
      agentTools = {
        ...agentTools,
        ...{
          "telegram-send-message": telegramTool,
        },
      };
      agentToolsListeners.telegram = telegramEventEmitter;
    }
    if (plugins.includes("github")) {
      const { getGithubTools } = await import("../plugins/github.js");
      const tools = await getGithubTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
    if (plugins.includes("filesystem")) {
      const { getFilesystemTools } = await import("../plugins/filesystem.js");
      const tools = await getFilesystemTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
    if (plugins.includes("nasa")) {
      const { getNasaTools } = await import("../plugins/nasa.js");
      const tools = await getNasaTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
    if (plugins.includes("fetch")) {
      const { getFetchTools } = await import("../plugins/fetch.js");
      const tools = await getFetchTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
    if (plugins.includes("solana")) {
      const { getSolanaTools } = await import("../plugins/solana.js");
      const tools = await getSolanaTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
  } catch (error) {
    console.error("Error loading plugins:", error);
  }
};
