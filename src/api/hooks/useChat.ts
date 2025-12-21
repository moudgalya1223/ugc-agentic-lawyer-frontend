import { useMutation } from "@tanstack/react-query";
import type { ApiResponse } from "@/utils/api-response";
import type {
  ConfidenceLevel,
  Jurisdiction,
  LegalCategory,
  TimeSensitivity,
} from "@/utils/response-metadata.utils";
import { api } from "../config";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  language?: string;
  tone?: "lawyer" | "normal";
}

export interface ResponseMetadata {
  confidence: ConfidenceLevel;
  legalCategory: LegalCategory;
  jurisdiction: Jurisdiction;
  timeSensitivity: TimeSensitivity;
}

export interface ChatResponse {
  message: string;
  metadata?: ResponseMetadata;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost?: number;
    is_byok?: boolean;
    prompt_tokens_details?: {
      cached_tokens?: number;
      audio_tokens?: number;
      video_tokens?: number;
    };
    cost_details?: {
      upstream_inference_cost?: number | null;
      upstream_inference_prompt_cost?: number;
      upstream_inference_completions_cost?: number;
    };
    completion_tokens_details?: {
      reasoning_tokens?: number;
      image_tokens?: number;
    };
  };
  model?: string;
}

export interface ChatApiResponse extends ApiResponse<ChatResponse> {}

export interface SuggestionsResponse {
  data: {
    suggestions: string[];
  };
  success: boolean;
}

export const useChatSuggestions = () => {
  return useMutation({
    mutationFn: async (chatHistory?: ChatMessage[]): Promise<string[]> => {
      const response = await api.post<SuggestionsResponse>(
        "/chat/suggestions",
        {
          data: {
            chatHistory:
              chatHistory && chatHistory.length > 0 ? chatHistory : undefined,
          },
        }
      );
      const responseData = response as SuggestionsResponse | undefined;

      return responseData?.data?.suggestions || [];
    },
  });
};

export const useChat = () => {
  const mutation = useMutation({
    mutationFn: async (data: ChatRequest): Promise<ChatResponse> => {
      const response = await api.post<ChatApiResponse>("/api/chat", {
        data,
      });

      const responseData = response.data as ChatApiResponse | undefined;

      // Check if response exists
      if (!responseData) {
        throw new Error("Failed to get chat response");
      }

      // Check if response has the expected API structure
      if (
        "success" in responseData &&
        typeof responseData.success === "boolean"
      ) {
        // If response is successful, return the data
        if (responseData.success && responseData.data) {
          return responseData.data;
        }

        // If response indicates failure, throw error with API message
        if (!responseData.success) {
          throw new Error(
            responseData.message || "Failed to get chat response"
          );
        }

        // If success is true but no data, throw error
        throw new Error("No data received from server");
      }

      // If response doesn't have 'success' field, it might be the data directly
      // Check if it looks like a ChatResponse
      const possibleChatResponse = responseData as unknown as ChatResponse;
      if (
        "message" in possibleChatResponse &&
        typeof possibleChatResponse.message === "string"
      ) {
        return possibleChatResponse;
      }

      throw new Error("Unexpected response format from server");
    },
  });

  return {
    ...mutation,
    sendChat: mutation.mutate,
    sendChatAsync: mutation.mutateAsync,
    isLoadingChat: mutation.isPending,
  };
};

/**
 * Stream chat response from API
 * @param data Chat request data
 * @param onChunk Callback function called with each chunk of content
 * @param onMetadata Optional callback function called with metadata when available
 * @returns Promise that resolves when streaming is complete
 */
export async function streamChat(
  data: ChatRequest,
  onChunk: (chunk: string) => void,
  onMetadata?: (metadata: ResponseMetadata) => void
): Promise<void> {
  // Use relative URL if baseURL is not set (Next.js API routes)
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "";
  const url = baseURL ? `${baseURL}/api/chat` : "/api/chat";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, {
        stream: true,
      });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === "data: [DONE]") {
          continue;
        }

        if (trimmedLine.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmedLine.slice(6));
            // Handle error messages from stream
            if (data.error && data.done) {
              throw new Error(data.error);
            }
            if (data.content && typeof data.content === "string") {
              onChunk(data.content);
            }
            // Handle metadata
            if (data.metadata && data.done && onMetadata) {
              onMetadata(data.metadata);
            }
          } catch (parseError) {
            // If it's an error from the stream, rethrow it
            if (parseError instanceof Error && parseError.message) {
              throw parseError;
            }
            // Otherwise, skip invalid JSON chunks
            console.error("Error parsing SSE chunk:", parseError);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
