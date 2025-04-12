import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { elmo } from "./agents.ts";
import dotenv from "dotenv";
import type { Agent } from "./types/agent.d.ts";

dotenv.config();

const agent = elmo;

const loadPlugins = async (agent: Agent) => {
  try {
    const { plugins } = agent;

    if (plugins.includes("discord")) {
      const { runDiscordPlugin } = await import("./plugins/discord.ts");
      await runDiscordPlugin(agent);
    }
  } catch (error) {
    console.error("Error loading plugins:", error);
  }
};

const main = async () => {
  await loadPlugins(agent);

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: `
      You are ${agent.name}. Your personality is: ${agent.personality}.
      Your system prompt is: ${agent.system}. Send a welcome message to the user.`,
  });

  console.log(text);
};

main();
