import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";
import { generate } from "./lib/generate.js";
import { agentTools, agentToolsListeners, loadPlugins } from "./lib/plugins.js";
import cronTool from "./tools/cron.js";
import { defaultPrompt } from "./lib/prompts.js";
import { agent } from "./lib/agent.js";
import { startAgentServer } from "./api/server.js";

dotenv.config();

const main = async () => {
  await loadPlugins(agent);

  Object.values(agentToolsListeners).forEach((listener: any) => {
    listener.on("message", async (message: any) => {
      try {
        console.log("New message event received:", message.content);

        await generate({
          model: openai("gpt-4o"),
          prompt:
            defaultPrompt +
            `\n\n${message.content} Respond to the message above, following the conversation history.`,
          tools: {
            ...agentTools,
            cronTool,
          },
          maxSteps: 10,
        });
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
  });
};

main();

startAgentServer();
