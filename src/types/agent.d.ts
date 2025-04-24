type AgentPlugin = "discord" | "github" | "filesystem" | "nasa" | "fetch" | "telegram"

export interface Agent {
  id: string;
  plugins: AgentPlugin[];
  pluginPrompts: Record<AgentPlugin, string>;
  name: string;
  personality: string;
  system: string;
}
