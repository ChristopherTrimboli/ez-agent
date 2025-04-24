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
      args: [
        path.resolve(
          __dirname,
          "../../src/mcps/solana-mcp-server/build/index.js"
        ),
      ],
    });

    const solanaMcp = await experimental_createMCPClient({
      transport,
    });

    return solanaMcp;
  } catch (error) {
    console.error("Error initializing Solana MCP:", error);
    throw error;
  }
};

const solanaMcp = await initMCP();

export const getTools = async (): Promise<any> => {
  return await solanaMcp.tools();
};
