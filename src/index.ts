import dotenv from "dotenv";
import { loadTools } from "./lib/tools.js";
import { agent } from "./agent.js";
import { startAgentServer } from "./api/server.js";

dotenv.config();

const startAgent = async () => {
  console.log(`Loading agent: ${agent.name}`);
  await loadTools(agent);
};

startAgent();
startAgentServer();
