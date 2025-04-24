import { AssistantContent, CoreMessage, ToolContent } from "ai";
import { agent } from "../agent.js";
import { encoding_for_model, Tiktoken, TiktokenModel } from "tiktoken";

const getModelMaxTokens = (model: TiktokenModel): number => {
  switch (model) {
    case "gpt-4o":
      return 200000;
    case "gpt-4o-mini":
      return 128000;
    case "gpt-4.1":
      return 1000000;
    case "gpt-4.1-mini":
      return 1000000;
    case "o4-mini":
      return 200000;
    default:
      return 100000;
  }
};

export class AgentHistory {
  private messages: CoreMessage[] = [];
  private maxTokens: number;
  private encoder: Tiktoken;

  constructor({ model = "gpt-4o" }: { model?: TiktokenModel }) {
    // Initialize with a system message if needed
    this.maxTokens = getModelMaxTokens(model);
    this.encoder = encoding_for_model(model);
  }

  addSystem(content: string) {
    this.messages.push({ role: "system", content });
    this.trim();
  }

  addUser(content: string) {
    this.messages.push({ role: "user", content });
    this.trim();
  }

  addAssistant(content: AssistantContent) {
    this.messages.push({ role: "assistant", content });
    this.trim();
  }

  addTool(content: ToolContent) {
    this.messages.push({ role: "tool", content });
    this.trim();
  }

  getAll(): CoreMessage[] {
    return [...this.messages];
  }

  private countTokens(msgs: CoreMessage[]): number {
    let total = 0;
    for (const m of msgs) {
      // count role + content tokens
      total += this.encoder.encode(m.role).length;
      total += this.encoder.encode(m.content.toString()).length;
    }
    console.log("Total tokens:", total);
    return total;
  }

  private trim() {
    // always keep the first message (system or first user)
    while (
      this.messages.length > 1 &&
      this.countTokens(this.messages) > this.maxTokens
    ) {
      // drop the oldest non-system message
      this.messages.splice(1, 1);
    }
  }
}

export const agentHistory = new AgentHistory({
  model: agent.model,
});
