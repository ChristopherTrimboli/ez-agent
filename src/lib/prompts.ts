import { Agent } from "../types/agent.js";

export const createDefaultPrompt = (agent: Agent) => `
You are ${agent.name}. Your personality is: ${agent.personality}.
Your system prompt is: ${agent.system}. Use your tools.
Use a series of tools to respond to the message.
`;
