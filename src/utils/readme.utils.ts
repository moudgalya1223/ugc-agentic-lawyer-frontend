import { promises as fs } from "fs";
import path from "path";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

/**
 * Saves chat conversation to a README file
 * @param messages - Array of chat messages
 * @param model - Model used for the response
 * @param usage - Token usage information
 * @returns Promise<void>
 */
export async function saveChatToReadme(
  messages: ChatMessage[],
  model?: string,
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }
): Promise<void> {
  try {
    // Get the project root directory (assuming this is in src/utils)
    const projectRoot = process.cwd();
    const readmePath = path.join(projectRoot, "CHAT_HISTORY.md");

    // Filter out system messages for the README
    const userMessages = messages.filter((msg) => msg.role !== "system");

    // Format the conversation as markdown
    let markdownContent = `# Chat History\n\n`;
    markdownContent += `**Generated on:** ${new Date().toISOString()}\n\n`;

    if (model) {
      markdownContent += `**Model used:** ${model}\n\n`;
    }

    if (usage) {
      markdownContent += `**Token Usage:**\n`;
      if (usage.prompt_tokens) {
        markdownContent += `- Prompt tokens: ${usage.prompt_tokens}\n`;
      }
      if (usage.completion_tokens) {
        markdownContent += `- Completion tokens: ${usage.completion_tokens}\n`;
      }
      if (usage.total_tokens) {
        markdownContent += `- Total tokens: ${usage.total_tokens}\n`;
      }
      markdownContent += `\n`;
    }

    markdownContent += `---\n\n`;

    // Add conversation messages
    for (const message of userMessages) {
      const role = message.role === "user" ? "User" : "Assistant";
      const timestamp = message.timestamp
        ? ` (${message.timestamp})`
        : ` (${new Date().toISOString()})`;

      markdownContent += `## ${role}${timestamp}\n\n`;
      markdownContent += `${message.content}\n\n`;
      markdownContent += `---\n\n`;
    }

    // Read existing content if file exists
    let existingContent = "";
    try {
      existingContent = await fs.readFile(readmePath, "utf-8");
    } catch {
      // File doesn't exist, that's okay
    }

    // Append new conversation to existing content
    const finalContent = existingContent
      ? `${existingContent}\n\n${markdownContent}`
      : markdownContent;

    // Write to file
    await fs.writeFile(readmePath, finalContent, "utf-8");
  } catch (error) {
    console.error("Error saving chat to README:", error);
    // Don't throw - we don't want to break the chat flow if file writing fails
  }
}
