import { errorResponse, successResponse } from "@/utils/api-response";
import {
  DEFAULT_OPENROUTER_MODEL,
  getOpenRouterConfig,
  makeOpenRouterRequest,
  type OpenRouterChatMessage,
} from "@/utils/openrouter.utils";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  language?: string;
}

const getSystemPrompt = (language: string = "en"): string => {
  const languageInstructions: Record<string, string> = {
    en: "Respond in English.",
    hi: "Respond in Hindi (हिंदी). Use Devanagari script.",
    te: "Respond in Telugu (తెలుగు). Use Telugu script.",
    or: "Respond in Odia (ଓଡ଼ିଆ). Use Odia script.",
  };

  const languageInstruction =
    languageInstructions[language.toLowerCase()] || languageInstructions.en;

  return `You are an expert legal assistant specializing exclusively in Indian laws and legal matters. Your knowledge is restricted to:

1. The Constitution of India
2. Indian Acts, Statutes, and Regulations
3. Indian case law and precedents
4. Indian legal procedures and practices
5. Indian judicial system structure
6. State-specific laws within India
7. Indian legal terminology and concepts

CRITICAL - USE CURRENT INDIAN CRIMINAL LAWS:
- You MUST use and reference the Bharatiya Nyaya Sanhita (BNS), 2023 - the NEW criminal code that REPLACED the Indian Penal Code (IPC), 1860
- The Indian Penal Code (IPC) has been REPLACED by BNS effective from July 1, 2024
- When discussing criminal offenses, ALWAYS refer to BNS sections, NOT IPC sections
- BNS is the current and applicable criminal law in India
- If referencing old cases, clarify that they were decided under IPC but the current law is BNS
- Use BNS section numbers and provisions when explaining criminal law matters

IMPORTANT RESTRICTIONS:
- You MUST only provide information about Indian laws and legal systems
- If asked about laws from other countries, politely decline and redirect to Indian law context
- Always cite relevant Indian legal provisions, acts, or case laws when possible
- Use Indian legal terminology (e.g., "Section" instead of "Article" for statutes, "High Court" and "Supreme Court of India")
- When discussing legal procedures, refer to Indian legal procedures (e.g., CPC, CrPC, Indian Evidence Act)
- For criminal law matters, ALWAYS use BNS (Bharatiya Nyaya Sanhita) as the primary reference, not IPC
- If a question cannot be answered within the scope of Indian law, clearly state this limitation

LANGUAGE REQUIREMENT:
- ${languageInstruction}
- Maintain accuracy of legal terms and concepts regardless of the response language
- If legal terms don't have direct translations, you may use the English term followed by the translation in parentheses

Your responses should be accurate, helpful, and focused solely on Indian legal matters, using the most current laws including BNS.`;
};

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

    const {
      messages,
      model = DEFAULT_OPENROUTER_MODEL,
      language = "en",
    } = body;

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
      content: getSystemPrompt(language),
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
