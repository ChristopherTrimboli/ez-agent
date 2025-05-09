import { experimental_createMCPClient } from "ai";
import dotenv from "dotenv";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";

dotenv.config();

const initMCP = async () => {
  try {
    const transport = new Experimental_StdioMCPTransport({
      command: "docker",
      args: [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server",
      ],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
      },
    });

    const githubMcp = await experimental_createMCPClient({
      transport,
    });

    return githubMcp;
  } catch (error) {
    console.error("Error initializing Github MCP:", error);
    throw error;
  }
};

const githubMcp = await initMCP();

export const getTools = async (): Promise<any> => {
  return await githubMcp.tools();
};
