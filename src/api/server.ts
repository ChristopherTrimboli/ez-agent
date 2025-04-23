import { openai } from "@ai-sdk/openai";
import express from "express";
import { generate } from "../lib/generate.js";
import { agentTools } from "../lib/plugins.js";
import { defaultPrompt } from "../lib/prompts.js";

export const startAgentServer = () => {
  const app = express();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.post("/generate", async (req, res) => {
    const event = req.body;
    const message = event.message;

    await generate({
      model: openai("gpt-4o"),
      prompt:
        defaultPrompt +
        `\n\n${message.content} Respond to the message above, following the conversation history.`,
      tools: agentTools,
      maxSteps: 10,
    });
  });

  app.listen(3001, () => {
    console.log("Server is running on port 3001");
  });
};
