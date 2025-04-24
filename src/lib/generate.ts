import { generateText, LanguageModelV1, ToolContent } from "ai";
import { agentHistory } from "./history.js";

export const generate = async ({
  model,
  prompt,
  tools,
  maxSteps,
  providerOptions,
}: {
  model: LanguageModelV1;
  prompt: string;
  tools: Record<string, any>;
  maxSteps: number;
  providerOptions?: {
    openai?: {
      reasoningSummary?: string;
    };
  };
}) => {
  try {
    agentHistory.addUser(prompt);

    // build the chat input from history plus new prompt
    const messages = agentHistory.getAll();

    const response = await generateText({
      model,
      tools,
      maxSteps,
      providerOptions,
      messages,
    });

    // record assistant messages
    for (const m of response.response.messages) {
      if (m.role === "assistant") {
        agentHistory.addAssistant(m.content);
      } else if (m.role === "tool") {
        agentHistory.addTool(m.content as ToolContent);
      }
    }

    return response;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};
