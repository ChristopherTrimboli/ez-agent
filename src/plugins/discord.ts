import { experimental_createMCPClient } from "ai";
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import type { Agent } from "../types/agent.js";
import path from "path";
import { fileURLToPath } from "url";
import EventEmitter from "events";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const discordEventEmitter = new EventEmitter();

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

export const getDiscordTools = async (): Promise<any> => {
  return await discordMcp.tools();
};

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

    discordEventEmitter.emit("message", {
      content: message.content,
      source: `discord-${message.channel.id}`,
    });
  });

  await client.login(process.env.DISCORD_TOKEN);
};
