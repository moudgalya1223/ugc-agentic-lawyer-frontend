import { errorResponse, successResponse } from "@/utils/api-response";
import {
  DEFAULT_OPENROUTER_MODEL,
  getOpenRouterConfig,
  makeOpenRouterRequest,
  parseOpenRouterArrayResponse,
} from "@/utils/openrouter.utils";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const PROMPT_SUGGESTIONS = [
  "What are the key provisions of the Indian Contract Act, 1872?",
  "Explain the procedure for filing a case in Indian courts",
  "What are my rights under the Consumer Protection Act, 2019?",
  "How does the Indian Penal Code define criminal offenses?",
  "What is the process for property registration in India?",
  "Explain the Right to Information (RTI) Act and how to file an RTI application",
  "What are the legal requirements for starting a business in India?",
  "How does the Indian Evidence Act govern admissibility of evidence?",
  "What are the rights of tenants under Indian rental laws?",
  "Explain the procedure for divorce under the Hindu Marriage Act",
  "What are the provisions of the Motor Vehicles Act regarding traffic violations?",
  "How does the Companies Act regulate corporate governance in India?",
  "What are the legal remedies available for consumer complaints?",
  "Explain the process of obtaining a will probate in India",
  "What are the labor laws regarding employee rights in India?",
];

interface SuggestionsRequest {
  chatHistory?: ChatMessage[];
}

async function generateSuggestions(
  chatHistory?: ChatMessage[]
): Promise<string[]> {
  const config = getOpenRouterConfig();
  const apiUrl =
    config?.apiUrl || "https://openrouter.ai/api/v1/chat/completions";

  let suggestions: string[] = [];

  // If chat history is provided, generate context-aware suggestions
  if (chatHistory && chatHistory.length > 0 && config) {
    try {
      const conversationContext = chatHistory
        .filter((msg) => msg.role !== "system")
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n");

      const suggestionPrompt = `Based on the following conversation about Indian law, generate 3-4 concise, relevant follow-up questions that the user might want to ask. Each question should be:
- Related to Indian laws and legal matters
- A natural follow-up or related topic to the conversation
- Specific and actionable
- Maximum 15 words each
- Focused on different aspects of the topics discussed

Conversation:
${conversationContext}

Return ONLY a JSON array of question strings, nothing else. Example: ["Question 1", "Question 2", "Question 3"]`;

      const suggestionResponse = await makeOpenRouterRequest(
        apiUrl,
        config.apiKey,
        DEFAULT_OPENROUTER_MODEL,
        [
          {
            role: "user",
            content: suggestionPrompt,
          },
        ],
        {
          usePlugins: false,
        }
      );

      if (suggestionResponse.ok) {
        const suggestionData = await suggestionResponse.json();
        const suggestionText =
          suggestionData.choices[0]?.message?.content || "";
        suggestions = parseOpenRouterArrayResponse(suggestionText);
      }
    } catch (error) {
      console.error(
        "Error parsing chat history or generating suggestions:",
        error
      );
      // Fall through to default suggestions
    }
  }

  // If no AI-generated suggestions, use default prompts
  if (suggestions.length === 0) {
    suggestions = PROMPT_SUGGESTIONS;
  }

  // Limit to maximum 4 suggestions
  return suggestions.slice(0, 4);
}

export async function POST(request: Request) {
  try {
    // Parse request body
    let body: SuggestionsRequest = {};
    try {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const text = await request.text();
        if (text && text.trim().length > 0) {
          body = JSON.parse(text);
        }
      }
    } catch (parseError) {
      // If parsing fails, continue with empty body (will use default suggestions)
      console.error("Error parsing request body:", parseError);
    }

    const { chatHistory } = body;
    const suggestions = await generateSuggestions(chatHistory);

    return successResponse(
      {
        suggestions,
      },
      "Prompt suggestions retrieved successfully"
    );
  } catch (error) {
    console.error("Suggestions API error:", error);
    return errorResponse(
      "An error occurred while fetching suggestions",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
}
