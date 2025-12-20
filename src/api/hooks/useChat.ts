import { useMutation } from "@tanstack/react-query";
import type { ApiResponse } from "@/utils/api-response";
import { api } from "../config";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
}

export interface ChatResponse {
  message: string;
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
      console.log("responseData :", responseData);

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
