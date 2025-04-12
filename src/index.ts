import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { elmo } from "./agents.js";
import dotenv from "dotenv";
import type { Agent } from "./types/agent.js";
import { discordEventEmitter } from "./plugins/discord.js";

dotenv.config();

const agent = elmo;

let agentTools: Record<string, any> = {};
const messageHistory: any[] = [];

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
    if (plugins.includes("filesystem")) {
      const { getFilesystemTools } = await import("./plugins/filesystem.js");
      const tools = await getFilesystemTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
    if (plugins.includes("nasa")) {
      const { getNasaTools } = await import("./plugins/nasa.js");
      const tools = await getNasaTools();
      agentTools = {
        ...agentTools,
        ...tools,
      };
    }
    if (plugins.includes("fetch")) {
      const { getFetchTools } = await import("./plugins/fetch.js");
      const tools = await getFetchTools();
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
    try {
      console.log("New message event received:", message.content);

      const response = await generateText({
        model: openai("gpt-4o"),
        prompt: `
          You are ${agent.name}. Your personality is: ${agent.personality}.
          Your system prompt is: ${agent.system}. Use your tools.
          New message request from user: "${message.content}" Do the request.
          Respond to the message in the channel: ${message.channel.id}.
          Use a series of tools to respond to the message. Always output response into Discord.
          Your previous messages are: ${JSON.stringify(
            messageHistory
          )}. Follow the conversation history.
          `,
        tools: agentTools,
        maxSteps: 10,
      });
      messageHistory.push({
        role: "user",
        content: message.content,
      });
      messageHistory.push(
        response.response.messages.map((m) => {
          return {
            role: "assistant",
            content: m.content,
          };
        })
      );
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });
};

main();
