import { openai } from "@ai-sdk/openai";
import { jsonSchema, tool } from "ai";
import { CronJob } from "cron";
import { generate } from "../lib/generate.js";

const cronTool = tool({
  description: "Run the given prompt at the specified ISO time",
  parameters: jsonSchema({
    type: "object",
    properties: {
      cronPattern: {
        type: "string",
        description:
          "The CRON pattern to run the prompt at, as stated by the user.",
      },
      prompt: {
        type: "string",
        description: "The prompt text to execute at that time",
      },
    },
    required: ["cronPattern", "prompt"],
  }),

  execute: async (args: any) => {
    new CronJob(
      args.cronPattern,
      async function () {
        await generate({
          model: openai("gpt-4o"),
          prompt: `run this:\n\n${args.prompt} Follow the conversation history.`,
          tools: {},
          maxSteps: 10,
        });
      },
      null,
      true,
      "America/Los_Angeles"
    );
    return { cronPattern: args.cronPattern, prompt: args.prompt };
  },
});

export const getTools = async (): Promise<Record<string, any>> => ({
  "cron-tool": cronTool,
});
