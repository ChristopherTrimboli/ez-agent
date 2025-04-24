import { openai } from "@ai-sdk/openai";
import express from "express";
import { generate } from "../lib/generate.js";
import { agentTools } from "../lib/tools.js";
import { createDefaultPrompt } from "../lib/prompts.js";
import { agent } from "../agent.js";

export const startAgentServer = () => {
  const app = express();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.post("/generate", async (req, res) => {
    try {
      console.log("Received request:", req.body);
      const event = req.body;
      const message = event.message;
      const agentId = event.agentId;

      const result = await generate({
        model: openai(agent.model),
        prompt:
          createDefaultPrompt(agentId) +
          `\n\n${message} Respond to the message above, following the conversation history.`,
        tools: agentTools,
        maxSteps: 10,
      });

      // Log and send the result for debugging
      console.log("Generate result:", result);
      res.status(200).json({ status: "Message processed", result });
    } catch (error) {
      console.error("Error in /generate:", error);
      res.status(500).json({ error });
    }
  });

  app.listen(3001, () => {
    console.log("Server is running on port 3001");
  });
};
