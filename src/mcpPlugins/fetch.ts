import { experimental_createMCPClient } from "ai";
import dotenv from "dotenv";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initMCP = async () => {
  try {
    const transport = new Experimental_StdioMCPTransport({
      command: "node",
      args: [path.resolve(__dirname, "../../src/mcps/fetch-mcp/dist/index.js")],
    });

    const fetchMcp = await experimental_createMCPClient({
      transport,
    });

    return fetchMcp;
  } catch (error) {
    console.error("Error initializing Github MCP:", error);
    throw error;
  }
};

const fetchMcp = await initMCP();

export const getTools = async (): Promise<any> => {
  return await fetchMcp.tools();
};
