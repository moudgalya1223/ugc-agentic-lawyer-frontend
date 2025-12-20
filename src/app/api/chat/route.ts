import { errorResponse, successResponse } from "@/utils/api-response";

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

async function makeOpenRouterRequest(
  apiUrl: string,
  apiKey: string,
  model: string,
  messagesWithSystem: ChatMessage[],
  usePlugins: boolean
) {
  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "",
      "X-Title": "Agentic Lawyer - Indian Law Assistant",
    },
    body: JSON.stringify({
      model,
      messages: messagesWithSystem,
      temperature: 0.7,
      max_tokens: 2000,
      ...(usePlugins && {
        plugins: [
          {
            id: "web",
          },
        ],
      }),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const apiUrl =
      process.env.OPENROUTER_API_URL ||
      "https://openrouter.ai/api/v1/chat/completions";

    if (!apiKey) {
      return errorResponse(
        "OpenRouter API key is not configured",
        undefined,
        500
      );
    }

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

    const { messages, model = "openrouter/auto" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse(
        "Messages array is required and cannot be empty",
        undefined,
        400
      );
    }

    // Prepend system message to ensure Indian law restriction
    const systemMessage: ChatMessage = {
      role: "system",
      content: INDIAN_LAW_SYSTEM_PROMPT,
    };

    // Check if system message already exists, if not prepend it
    const hasSystemMessage = messages.some((msg) => msg.role === "system");
    const messagesWithSystem = hasSystemMessage
      ? messages
      : [
          systemMessage,
          ...messages,
        ];

    // Try primary model first
    let response = await makeOpenRouterRequest(
      apiUrl,
      apiKey,
      model,
      messagesWithSystem,
      true
    );

    // If primary model fails, try fallback model
    if (!response.ok) {
      console.log(
        `Primary model ${model} failed, trying fallback: openai/gpt-oss-20b:free`
      );
      response = await makeOpenRouterRequest(
        apiUrl,
        apiKey,
        "openai/gpt-oss-20b:free",
        messagesWithSystem,
        false
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return errorResponse(
        errorData.error?.message || "Failed to get response from OpenRouter",
        errorData,
        response.status
      );
    }

    const data = await response.json();

    return successResponse(
      {
        message: data.choices[0]?.message?.content || "",
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
