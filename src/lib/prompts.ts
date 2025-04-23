import { agent } from "./agent.js";
import { messageHistory } from "./history.js";

export const defaultPrompt = `
You are ${agent.name}. Your personality is: ${agent.personality}.
Your system prompt is: ${agent.system}. Use your tools.
Use a series of tools to respond to the message.
Your previous messages are: ${JSON.stringify(
  messageHistory
)}. Follow the conversation history.
`;
