import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { elmo } from "./agents.js";
import dotenv from "dotenv";
import type { Agent } from "./types/agent.js";
import { discordEventEmitter } from "./plugins/discord.js";

dotenv.config();

const agent = elmo;

let agentTools: Record<string, any> = {};

const loadPlugins = async (agent: Agent) => {
  try {
    const { plugins } = agent;

    if (plugins.includes("discord")) {
      const { runDiscordPlugin, getDiscordTools } = await import(
        "./plugins/discord.js"
      );
      await runDiscordPlugin(agent);
      const tools = await getDiscordTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
    if (plugins.includes("github")) {
      const { getGithubTools } = await import("./plugins/github.js");
      const tools = await getGithubTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
  } catch (error) {
    console.error("Error loading plugins:", error);
  }
};

const main = async () => {
  await loadPlugins(agent);

  discordEventEmitter.on("message", async (message) => {
    console.log("New message event received:", message.content);

    await generateText({
      model: openai("gpt-4o"),
      prompt: `
        You are ${agent.name}. Your personality is: ${agent.personality}.
        Your system prompt is: ${agent.system}. Use your tools for github and discord.
        New message request from user: "${message.content}" Do the request.
        Respond to the message in the channel: ${message.channel.id}.
        Use a series of tools to respond to the message. Always output response into Discord.
        `,
      tools: agentTools,
      maxSteps: 10,
    });
  });
};

main();
