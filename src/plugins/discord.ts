import { openai } from "@ai-sdk/openai";
import { experimental_createMCPClient, generateText } from "ai";
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import type { Agent } from "../types/agent.d.ts";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initDiscordMCP = async () => {
  try {
    const transport = new Experimental_StdioMCPTransport({
      command: "node",
      args: [
        path.resolve(__dirname, "../../src/mcps/discordmcp/build/index.js"),
      ],
      env: {
        DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
      },
    });

    const discordMcp = await experimental_createMCPClient({
      transport,
    });

    return discordMcp;
  } catch (error) {
    console.error("Error initializing Discord MCP:", error);
    throw error;
  }
};

const discordMcp = await initDiscordMCP();

export const { tools }: any = discordMcp;

export const runDiscordPlugin = async (agent: Agent) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once("ready", () => {
    console.log("Discord bot is ready!");
  });

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const channelId = message.channel.id;

    // Handle message
    console.log(`Received message: ${message.content}`);

    await generateText({
      model: openai("gpt-4o"),
      prompt: `
        You are ${agent.name}. Your personality is: ${agent.personality}.
        Your discord prompt is: ${agent.pluginPrompts.discord}. Respond to the message: "${message.content}". Use discordmcp tools. Respond in the channel: ${channelId}.`,
      tools: await discordMcp.tools(),
    });
  });

  await client.login(process.env.DISCORD_TOKEN);
};
