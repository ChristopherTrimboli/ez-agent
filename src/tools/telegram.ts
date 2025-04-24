import { jsonSchema, tool } from "ai";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import EventEmitter from "events";

export const telegramEventEmitter = new EventEmitter();

let bot: Telegraf;

export const startTelegramTool = async () => {
  try {
    bot = new Telegraf(process.env.TELEGRAM_TOKEN!);

    console.log("Telegram bot initialized");

    bot.on(message(), (ctx) => {
      if ("text" in ctx.message && typeof ctx.message.text === "string") {
        const message = ctx.message.text;
        console.log("New message event received:", message);

        if (message) {
          console.log("Emitting message event:", message);
          telegramEventEmitter.emit("message", {
            content: message,
            source: "telegram",
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

export const telegramTool = tool({
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
    console.log(args);
    bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, args.message);
    return { message: args.message };
  },
});
