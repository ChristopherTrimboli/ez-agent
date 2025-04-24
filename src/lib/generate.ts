import { generateText, LanguageModelV1 } from "ai";
import { messageHistory } from "./history.js";

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
    const response = await generateText({
      model,
      prompt,
      tools,
      maxSteps,
    });

    messageHistory.push({
      role: "user",
      content: prompt,
    });
    messageHistory.push(
      response.response.messages.map((m) => {
        return {
          role: "assistant",
          content: m.content,
        };
      })
    );
    return response;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};
