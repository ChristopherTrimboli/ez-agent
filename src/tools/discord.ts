import { jsonSchema, tool } from "ai";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import EventEmitter from "events";
import { generate } from "../lib/generate.js";
import { createDefaultPrompt } from "../lib/prompts.js";
import { agentTools } from "../lib/tools.js";
import { openai } from "@ai-sdk/openai";
import { Agent } from "../types/agent.js";

export const discordEventEmitter = new EventEmitter();

let client: Client;

const messageCache: Array<{
  content: string;
  channelId: string;
  author: string;
}> = [];

export const startTool = async (agent: Agent) => {
  try {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel],
    });

    client.once("ready", () => {
      console.log("Discord bot initialized");
    });

    client.on("messageCreate", async (message) => {
      if (message.author.bot) return;

      messageCache.push({
        content: message.content,
        channelId: message.channel.id,
        author: message.author.username,
      });

      const channelId = message.channel.id;

      discordEventEmitter.emit("message", {
        content: message.content,
        source: `discord-${channelId}`,
      });

      console.log(
        "DISCORD MESSAGE:",
        message.content + " in channel: ",
        channelId
      );

      if (message.content) {
        await generate({
          model: openai("o4-mini", {
            structuredOutputs: false,
          }),
          prompt:
            createDefaultPrompt(agent) +
            `\n\n${message.content} Respond to the message above, following the conversation history. 
            This message came from Discord in the channel: ${channelId}. 
            The message came from userId: ${message.author.id}. Their username is ${message.author.username}.
            The messageId is ${message.id}.
            `,
          tools: {
            ...agentTools,
          },
          providerOptions: {
            openai: {
              reasoningSummary: "detailed",
            },
          },
          maxSteps: 10,
        });
      }
    });

    await client.login(process.env.DISCORD_TOKEN!);
  } catch (error) {
    console.error("Error initializing Discord bot:", error);
    throw error;
  }
};

const sendMessageTool = tool({
  description:
    "Send a notification message to a Discord channel or reply directly to a user (no response required)",
  parameters: jsonSchema({
    type: "object",
    properties: {
      channelId: {
        type: "string",
        description:
          "The ID of the Discord channel to send the message to (optional if userId is provided)",
      },
      userId: {
        type: "string",
        description:
          "The ID of the Discord user to DM (optional if channelId is provided)",
      },
      messageId: {
        type: "string",
        description:
          "The ID of the message to reply to in the channel (optional, requires channelId)",
      },
      message: {
        type: "string",
        description: "The message to send",
      },
    },
    required: ["message"],
  }),

  execute: async (args: any) => {
    if (args.userId) {
      // Send a DM to the user
      const user = await client.users.fetch(args.userId);
      if (user) {
        await user.send(args.message);
        return { message: args.message, userId: args.userId };
      }
      throw new Error("User not found");
    } else if (args.channelId) {
      const channel = await client.channels.fetch(args.channelId);
      if (
        channel &&
        "sendTyping" in channel &&
        typeof channel.sendTyping === "function"
      ) {
        await channel.sendTyping();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (args.messageId) {
          // Reply to a specific message in the channel
          const originalMessage = await channel.messages.fetch(args.messageId);
          if (originalMessage) {
            await originalMessage.reply(args.message);
            return {
              message: args.message,
              channelId: args.channelId,
              repliedTo: args.messageId,
            };
          }
          throw new Error("Original message not found for reply");
        } else {
          // Send a normal message to the channel
          await channel.send(args.message);
          return { message: args.message, channelId: args.channelId };
        }
      }
      throw new Error("Channel not found or not text-based");
    }
    throw new Error("Either channelId or userId must be provided");
  },
});

const readMessagesTool = tool({
  description:
    "Read recent messages from a Discord channel (no response required)",
  parameters: jsonSchema({
    type: "object",
    properties: {
      channelId: {
        type: "string",
        description: "The ID of the Discord channel to read messages from",
      },
      limit: {
        type: "number",
        description: "Number of messages to fetch (max 100)",
        default: 50,
      },
      query: {
        type: "string",
        description: "Optional: search for messages containing this text",
      },
    },
    required: ["channelId", "limit"],
  }),

  execute: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 100);
    const channel = await client.channels.fetch(args.channelId);
    if (!channel || !("messages" in channel)) {
      throw new Error("Channel not found or does not support messages");
    }
    // Fetch recent messages from Discord API
    const fetched = await channel.messages.fetch({ limit });
    let messages = Array.from(fetched.values()).map((msg) => ({
      id: msg.id,
      content: msg.content,
      author: msg.author.username,
      authorId: msg.author.id,
      timestamp: msg.createdTimestamp,
    }));

    // If a query is provided, filter messages by content
    if (args.query) {
      messages = messages.filter((m) =>
        m.content.toLowerCase().includes(args.query.toLowerCase())
      );
    }

    return { messages };
  },
});

const searchUsersTool = tool({
  description:
    "Search for a Discord user by username and return their userId (searches all guilds the bot is in).",
  parameters: jsonSchema({
    type: "object",
    properties: {
      username: {
        type: "string",
        description:
          "The username to search for (case-insensitive, not unique).",
      },
    },
    required: ["username"],
  }),

  execute: async (args: any) => {
    const search = args.username.toLowerCase();

    // 1. Search in the client's user cache (fast)
    let found = client.users.cache.find(
      (user) => user.username.toLowerCase() === search
    );
    if (found) {
      return {
        userId: found.id,
        username: found.username,
        discriminator: found.discriminator,
        tag: `${found.username}#${found.discriminator}`,
        matchType: "exact",
      };
    }

    // 2. Search all guilds (fetch all members)
    for (const guild of client.guilds.cache.values()) {
      // Fetch all members (forces API call if not cached)
      let members;
      try {
        members = await guild.members.fetch();
      } catch (e) {
        continue; // skip guilds where fetch fails
      }
      // Find exact match (case-insensitive)
      let member = members.find(
        (m) => m.user.username.toLowerCase() === search
      );
      if (member) {
        return {
          userId: member.user.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          tag: `${member.user.username}#${member.user.discriminator}`,
          guildId: guild.id,
          guildName: guild.name,
          matchType: "exact-guild",
        };
      }
      // Find partial matches (case-insensitive)
      const partialMatches = members.filter((m) =>
        m.user.username.toLowerCase().includes(search)
      );
      if (partialMatches.size > 0) {
        return {
          matches: partialMatches.map((m) => ({
            userId: m.user.id,
            username: m.user.username,
            discriminator: m.user.discriminator,
            tag: `${m.user.username}#${m.user.discriminator}`,
            guildId: guild.id,
            guildName: guild.name,
          })),
          matchType: "partial-guild",
        };
      }
    }

    throw new Error(
      "User not found in any guild. Usernames are not unique; try using userId if possible."
    );
  },
});

export const getTools = async (): Promise<Record<string, any>> => ({
  "discord-send-message": sendMessageTool,
  "discord-read-messages": readMessagesTool,
  "discord-search-users": searchUsersTool,
});
