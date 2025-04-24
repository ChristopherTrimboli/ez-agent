import dotenv from "dotenv";
import { loadTools } from "./lib/tools.js";
import { agents } from "./agents.js";
import { startAgentServer } from "./api/server.js";

dotenv.config();

const startAgent = async () => {
  for (const agent of agents) {
    console.log(`Loading agent: ${agent.name}`);
    await loadTools(agent);
  }
};

startAgent();
startAgentServer();
