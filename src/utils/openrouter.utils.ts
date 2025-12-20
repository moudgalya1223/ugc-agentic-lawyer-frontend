export const DEFAULT_OPENROUTER_MODEL = "mistralai/devstral-2512:free";

export interface OpenRouterChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  usePlugins?: boolean;
  stream?: boolean;
}

export interface OpenRouterConfig {
  apiKey: string;
  apiUrl: string;
}

/**
 * Get OpenRouter API configuration from environment variables
 */
export function getOpenRouterConfig(): OpenRouterConfig | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiUrl =
    process.env.OPENROUTER_API_URL ||
    "https://openrouter.ai/api/v1/chat/completions";

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    apiUrl,
  };
}

/**
 * Make a request to OpenRouter API
 */
export async function makeOpenRouterRequest(
  apiUrl: string,
  apiKey: string,
  messages: OpenRouterChatMessage[],
  options: OpenRouterRequestOptions = {}
): Promise<Response> {
  const {
    temperature = 0.7,
    maxTokens = 2000,
    usePlugins = false,
    stream = false,
  } = options;

  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "",
      "X-Title": "Agentic Lawyer - Indian Law Assistant",
    },
    body: JSON.stringify({
      model: DEFAULT_OPENROUTER_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
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

/**
 * Get language instruction for system prompts
 * Returns the appropriate instruction based on the language code
 */
export function getLanguageInstruction(language: string = "en"): string {
  const languageInstructions: Record<string, string> = {
    en: "Respond in English.",
    hi: "Respond in Hindi (हिंदी). Use Devanagari script.",
    te: "Respond in Telugu (తెలుగు). Use Telugu script.",
    or: "Respond in Odia (ଓଡ଼ିଆ). Use Odia script.",
  };

  return (
    languageInstructions[language.toLowerCase()] || languageInstructions.en
  );
}

/**
 * Parse JSON array from OpenRouter response text
 * Handles both JSON arrays and text formats
 */
export function parseOpenRouterArrayResponse(responseText: string): string[] {
  try {
    // Try to parse JSON array from the response
    const parsed = JSON.parse(responseText.trim());
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter((item) => typeof item === "string").slice(0, 4);
    }
  } catch {
    // If parsing fails, try to extract questions from text
    const lines = responseText
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line.match(/^["\d-]/));
    if (lines.length > 0) {
      return lines
        .map((line: string) =>
          line.replace(/^["\d-.\s]+/, "").replace(/["\s]*$/, "")
        )
        .filter((q: string) => q.length > 10 && q.length < 100)
        .slice(0, 4);
    }
  }
  return [];
}
