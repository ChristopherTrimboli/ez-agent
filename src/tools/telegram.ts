import { jsonSchema, tool } from "ai";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import EventEmitter from "events";
import { generate } from "../lib/generate.js";
import { createDefaultPrompt } from "../lib/prompts.js";
import { agentTools } from "../lib/tools.js";
import { openai } from "@ai-sdk/openai";
import { Agent } from "../types/agent.js";

export const telegramEventEmitter = new EventEmitter();

let bot: Telegraf;

const messageCache: string[] = [];

export const startTool = async (agent: Agent) => {
  try {
    bot = new Telegraf(process.env.TELEGRAM_TOKEN!);

    console.log("Telegram bot initialized");

    bot.on(message(), async (ctx) => {
      if ("text" in ctx.message && typeof ctx.message.text === "string") {
        messageCache.push(ctx.message.text);

        const message = ctx.message.text;
        console.log("New message event received:", message);

        telegramEventEmitter.emit("message", {
          content: message,
          source: "telegram",
        });

        if (message) {
          console.log("Emitting message event:", message);
          await generate({
            model: openai("o4-mini", {
              structuredOutputs: false,
            }),
            prompt:
              createDefaultPrompt(agent) +
              `\n\n${message} Respond to the message above, following the conversation history. 
              This message came from Telegram.
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
      }
    });

    bot.launch();
  } catch (error) {
    console.error("Error initializing Telegram bot:", error);
    throw error;
  }
};

const sendMessageTool = tool({
  description:
    "Send a notification message to the user via Telegram (no response required)",
  parameters: jsonSchema({
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The message to send to the user",
      },
    },
    required: ["message"],
  }),

  execute: async (args: any) => {
    bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, args.message);
    return { message: args.message };
  },
});

const readMessagesTool = tool({
  description:
    "Read recent messages from a Telegram chat (no response required)",
  parameters: jsonSchema({
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Number of messages to fetch (max 100)",
        default: 50,
      },
    },
    required: ["limit"],
  }),

  execute: async (args: any) => {
    const limit = Math.min(args.limit ?? 50, 100);
    return { messages: messageCache.slice(-limit) };
  },
});

export const getTools = async (): Promise<Record<string, any>> => ({
  "telegram-send-message": sendMessageTool,
  "telegram-read-messages": readMessagesTool,
});
