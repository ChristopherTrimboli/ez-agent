import { openai } from "@ai-sdk/openai";
import { jsonSchema, tool } from "ai";
import { CronJob } from "cron";
import { generate } from "../lib/generate.js";
import { agent } from "../agent.js";

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
        description: "The prompt text to execute at that time.",
      },
    },
    required: ["cronPattern", "prompt"],
  }),

  execute: async (args: any) => {
    console.log("Cron job started with pattern:", args.cronPattern);
    console.log("Prompt to execute:", args.prompt);
    new CronJob(
      args.cronPattern,
      async function () {
        await generate({
          model: openai(agent.model, {
            structuredOutputs: false,
          }),
          prompt: `run this:\n\n${args.prompt} Follow the conversation history.`,
          tools: {},
          maxSteps: 10,
          providerOptions: {
            openai: {
              reasoningSummary: "detailed",
            },
          },
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
