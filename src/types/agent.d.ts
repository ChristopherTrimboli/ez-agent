type AgentMcp = "github" | "filesystem" | "nasa" | "fetch" | "solana";

type AgentTool = "telegram" | "cron" | "discord";

export interface Agent {
  id: string;
  model: LanguageModelV1;
  mcps: AgentMcp[];
  tools: AgentTool[];
  pluginPrompts: Record<AgentMcp, string>;
  name: string;
  personality: string;
  system: string;
}
