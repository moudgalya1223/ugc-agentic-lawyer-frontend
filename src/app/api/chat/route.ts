import { errorResponse, successResponse } from "@/utils/api-response";
import {
  DEFAULT_OPENROUTER_MODEL,
  getOpenRouterConfig,
  makeOpenRouterRequest,
  type OpenRouterChatMessage,
} from "@/utils/openrouter.utils";
import { saveChatToReadme } from "@/utils/readme.utils";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
}

const INDIAN_LAW_SYSTEM_PROMPT = `You are an expert legal assistant specializing exclusively in Indian laws and legal matters. Your knowledge is restricted to:

1. The Constitution of India
2. Indian Acts, Statutes, and Regulations
3. Indian case law and precedents
4. Indian legal procedures and practices
5. Indian judicial system structure
6. State-specific laws within India
7. Indian legal terminology and concepts

IMPORTANT RESTRICTIONS:
- You MUST only provide information about Indian laws and legal systems
- If asked about laws from other countries, politely decline and redirect to Indian law context
- Always cite relevant Indian legal provisions, acts, or case laws when possible
- Use Indian legal terminology (e.g., "Section" instead of "Article" for statutes, "High Court" and "Supreme Court of India")
- When discussing legal procedures, refer to Indian legal procedures (e.g., CPC, CrPC, Indian Evidence Act)
- If a question cannot be answered within the scope of Indian law, clearly state this limitation

Your responses should be accurate, helpful, and focused solely on Indian legal matters.`;

export async function POST(request: Request) {
  try {
    const config = getOpenRouterConfig();
    if (!config) {
      return errorResponse(
        "OpenRouter API key is not configured",
        undefined,
        500
      );
    }

    const { apiKey, apiUrl } = config;

    // Check if request has a body
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return errorResponse(
        "Request must have Content-Type: application/json",
        undefined,
        400
      );
    }

    // Parse request body with error handling
    let body: ChatRequest;
    try {
      const text = await request.text();
      if (!text || text.trim().length === 0) {
        return errorResponse(
          "Request body is required and cannot be empty",
          undefined,
          400
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return errorResponse(
        "Invalid JSON in request body",
        parseError instanceof Error ? parseError.message : String(parseError),
        400
      );
    }

    const { messages, model = DEFAULT_OPENROUTER_MODEL } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse(
        "Messages array is required and cannot be empty",
        undefined,
        400
      );
    }

    // Prepend system message to ensure Indian law restriction
    const systemMessage: OpenRouterChatMessage = {
      role: "system",
      content: INDIAN_LAW_SYSTEM_PROMPT,
    };

    // Check if system message already exists, if not prepend it
    const hasSystemMessage = messages.some((msg) => msg.role === "system");
    const messagesWithSystem: OpenRouterChatMessage[] = hasSystemMessage
      ? (messages as OpenRouterChatMessage[])
      : [
          systemMessage,
          ...(messages as OpenRouterChatMessage[]),
        ];

    // Make request with the specified model (defaults to openai/gpt-oss-20b:free)
    const response = await makeOpenRouterRequest(
      apiUrl,
      apiKey,
      model,
      messagesWithSystem,
      {
        usePlugins: false,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return errorResponse(
        errorData.error?.message || "Failed to get response from OpenRouter",
        errorData,
        response.status
      );
    }

    const data = await response.json();
    const chatResponse = data.choices[0]?.message?.content || "";

    // Save chat conversation to README file
    const messagesWithResponse: OpenRouterChatMessage[] = [
      ...messagesWithSystem,
      {
        role: "assistant",
        content: chatResponse,
      },
    ];

    // Save to README asynchronously (don't wait for it)
    saveChatToReadme(
      messagesWithResponse.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date().toISOString(),
      })),
      data.model,
      data.usage
    ).catch((error) => {
      console.error("Failed to save chat to README:", error);
    });

    return successResponse(
      {
        message: chatResponse,
        usage: data.usage,
        model: data.model,
      },
      "Chat response generated successfully"
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return errorResponse(
      "An error occurred while processing your request",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
}
