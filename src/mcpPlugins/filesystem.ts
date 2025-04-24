import { experimental_createMCPClient } from "ai";
import dotenv from "dotenv";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";

dotenv.config();

const initMCP = async () => {
  try {
    const transport = new Experimental_StdioMCPTransport({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/cjft/Documents/agent",
      ],
    });

    const filesystemMcp = await experimental_createMCPClient({
      transport,
    });

    return filesystemMcp;
  } catch (error) {
    console.error("Error initializing filesystem MCP:", error);
    throw error;
  }
};

const filesystemMcp = await initMCP();

export const getTools = async (): Promise<any> => {
  return await filesystemMcp.tools();
};
