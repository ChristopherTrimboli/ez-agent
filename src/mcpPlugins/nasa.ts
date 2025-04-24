import { experimental_createMCPClient } from "ai";
import dotenv from "dotenv";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";

dotenv.config();

const initMCP = async () => {
  try {
    const transport = new Experimental_StdioMCPTransport({
      command: "npx",
      args: ["-y", "@programcomputer/nasa-mcp-server"],
      env: {
        NASA_API_KEY: process.env.NASA_API_KEY!,
      },
    });

    const nasaMcp = await experimental_createMCPClient({
      transport,
    });

    return nasaMcp;
  } catch (error) {
    console.error("Error initializing NASA MCP:", error);
    throw error;
  }
};

const nasaMcp = await initMCP();

export const getTools = async (): Promise<any> => {
  return await nasaMcp.tools();
};
