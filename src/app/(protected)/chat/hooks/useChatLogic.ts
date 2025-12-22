import { notifications } from "@mantine/notifications";
import { convertMarkdownToDocx, downloadDocx } from "@mohtasham/md-to-docx";
import { useCallback, useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import type {
  ChatMessage as ChatMessageType,
  ResponseMetadata,
} from "@/api/hooks";
import { streamChat, useChatSuggestions } from "@/api/hooks";
import { useTranslation } from "@/i18n";
import { useLocalStore } from "@/store";
import {
  extractRedditUrl,
  getDraftType,
  isDraftRequest,
} from "@/utils/chat.utils";
import { extractTextFromPDF } from "@/utils/pdf.utils";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  file?: {
    name: string;
    url: string;
  };
  isDraft?: boolean;
  metadata?: ResponseMetadata;
}

interface UseChatLogicOptions {
  initialMessage?: string;
  initialMessages?: Message[];
}

interface UseChatLogicReturn {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  selectedFile: File | null;
  isExtractingPdf: boolean;
  isParsingReddit: boolean;
  isStreaming: boolean;
  suggestions: string[];
  tone: "lawyer" | "normal";
  setTone: (tone: "lawyer" | "normal") => void;
  listening: boolean;
  browserSupportsSpeechRecognition: boolean;
  handleSend: () => Promise<void>;
  handleFileUpload: (file: File | null) => void;
  handleSuggestionClick: (suggestion: string) => void;
  handleMicClick: () => Promise<void>;
  handleDownloadDraft: (
    markdownContent: string,
    messageId: string
  ) => Promise<void>;
  parseRedditUrl: (url: string) => Promise<{
    title: string;
    description: string;
  }>;
  resetRef: React.MutableRefObject<(() => void) | null>;
}

export function useChatLogic(
  options: UseChatLogicOptions = {}
): UseChatLogicReturn {
  const { t } = useTranslation();
  const { preferredLanguage } = useLocalStore();
  const { mutateAsync: fetchSuggestionsAsync } = useChatSuggestions();
  const resetRef = useRef<() => void>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (options.initialMessages && options.initialMessages.length > 0) {
      return options.initialMessages;
    }
    return [
      {
        id: "1",
        text: options.initialMessage || t("chat.welcomeMessage"),
        sender: "bot",
        timestamp: new Date(),
      },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isParsingReddit, setIsParsingReddit] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tone, setTone] = useState<"lawyer" | "normal">("normal");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Update welcome message when language changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: its asking for "t", but t is a function and we dont function in dependency array
  useEffect(() => {
    setMessages((prevMessages) => {
      const firstMessage = prevMessages[0];
      if (
        prevMessages.length === 1 &&
        firstMessage?.sender === "bot" &&
        firstMessage?.id === "1"
      ) {
        return [
          {
            id: "1",
            text: t("chat.welcomeMessage"),
            sender: "bot",
            timestamp: firstMessage.timestamp,
          },
        ];
      }
      return prevMessages;
    });
  }, [
    preferredLanguage,
  ]);

  // Update input value from speech recognition transcript
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [
    transcript,
  ]);

  const handleMicClick = async () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        resetTranscript();
        SpeechRecognition.startListening({
          continuous: true,
          language: "en-US",
        });
      } catch (err: unknown) {
        console.log("error", err);
        notifications.show({
          title: t("chat.errorMessages.permissionDenied"),
          message: t("chat.errorMessages.permissionDeniedMessage"),
          color: "red",
        });
      }
    }
  };

  const parseRedditUrl = useCallback(async (url: string) => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "";
      const apiUrl = baseURL
        ? `${baseURL}/api/url-parser?url=${encodeURIComponent(url)}`
        : `/api/url-parser?url=${encodeURIComponent(url)}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to parse Reddit URL: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message || "Failed to parse Reddit post");
      }

      return data.data as {
        title: string;
        description: string;
      };
    } catch (error) {
      console.error("Error parsing Reddit URL:", error);
      throw error;
    }
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() && !selectedFile) {
      return;
    }

    const userMessageText = inputValue.trim();
    const hasFile = !!selectedFile;
    const fileName = selectedFile?.name || "";
    let extractedPdfText = "";

    // Check if input contains a Reddit URL
    const redditUrl = extractRedditUrl(userMessageText);
    let redditContent: {
      title: string;
      description: string;
    } | null = null;

    if (redditUrl) {
      try {
        setIsParsingReddit(true);
        redditContent = await parseRedditUrl(redditUrl);

        notifications.show({
          title: t("chat.reddit.parseSuccess") || "Reddit post parsed",
          message:
            t("chat.reddit.parseSuccessMessage") ||
            "Successfully extracted Reddit post content",
          color: "green",
          autoClose: 3000,
        });
      } catch (error) {
        setIsParsingReddit(false);
        console.error("Error parsing Reddit URL:", error);
        notifications.show({
          title: t("common.error"),
          message:
            error instanceof Error
              ? error.message
              : t("chat.errorMessages.redditParseFailed") ||
                "Failed to parse Reddit post",
          color: "red",
        });
        return;
      } finally {
        setIsParsingReddit(false);
      }
    }

    // Extract text from PDF if file is attached
    if (selectedFile && selectedFile.type === "application/pdf") {
      try {
        setIsExtractingPdf(true);
        extractedPdfText = await extractTextFromPDF(selectedFile);
        setIsExtractingPdf(false);

        notifications.show({
          title: t("chat.fileAttachment.extractionSuccess"),
          message: t("chat.fileAttachment.extractionSuccessMessage"),
          color: "green",
          autoClose: 3000,
        });
      } catch (error) {
        setIsExtractingPdf(false);
        console.error("Error extracting PDF text:", error);
        notifications.show({
          title: t("common.error"),
          message:
            error instanceof Error
              ? error.message
              : t("chat.errorMessages.pdfExtractionFailed"),
          color: "red",
        });
        return;
      }
    }

    // Check if this is a draft request
    const isDraft = isDraftRequest(userMessageText);

    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
    };

    if (selectedFile) {
      const fileUrl = URL.createObjectURL(selectedFile);
      newMessage.file = {
        name: selectedFile.name,
        url: fileUrl,
      };
      setSelectedFile(null);
      resetRef.current?.();
    }

    setMessages((prev) => [
      ...prev,
      newMessage,
    ]);
    setInputValue("");

    // Convert messages to ChatMessage format for API
    const chatMessages: ChatMessageType[] = messages
      .filter((msg) => msg.sender !== "bot" || msg.text)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

    // Build user message content with PDF text and/or Reddit content if available
    let userMessageContent = userMessageText;

    // Add Reddit content if parsed
    if (redditContent) {
      const redditSection = `Reddit Post:\nTitle: ${redditContent.title}\n\nDescription:\n${redditContent.description}`;
      userMessageContent = userMessageContent
        ? `${redditSection}\n\n${userMessageText || "Please analyze this Reddit post and provide advice."}`
        : `${redditSection}\n\nPlease analyze this Reddit post and provide advice.`;
    }

    if (hasFile) {
      if (extractedPdfText) {
        const pdfSection = `${t("chat.fileAttachment.userAttachedFile", {
          fileName,
        })}\n\n${t("chat.fileAttachment.documentContent")}:\n\n${extractedPdfText}`;
        userMessageContent = userMessageContent
          ? `${userMessageContent}\n\n${pdfSection}`
          : `${t("chat.fileAttachment.userAttachedFile", {
              fileName,
            })}\n\n${t("chat.fileAttachment.documentContent")}:\n\n${extractedPdfText}`;
      } else {
        const fileSection = t("chat.fileAttachment.userAttachedFile", {
          fileName,
        });
        userMessageContent = userMessageContent
          ? `${userMessageContent}\n\n${fileSection}`
          : fileSection;
      }
    }

    // Add current user message
    chatMessages.push({
      role: "user",
      content: userMessageContent,
    });

    // Create a placeholder bot message for streaming
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isDraft,
    };

    setMessages((prev) => [
      ...prev,
      botMessage,
    ]);
    setIsStreaming(true);

    try {
      let fullResponse = "";

      // Stream the chat response
      await streamChat(
        {
          messages: chatMessages,
          language: preferredLanguage || "en",
          tone,
        },
        (chunk: string) => {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? {
                    ...msg,
                    text: fullResponse,
                  }
                : msg
            )
          );
        },
        (metadata: ResponseMetadata) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? {
                    ...msg,
                    metadata,
                  }
                : msg
            )
          );
        }
      );

      setIsStreaming(false);

      // Fetch suggestions after bot reply
      try {
        const updatedChatHistory: ChatMessageType[] = [
          ...chatMessages,
          {
            role: "assistant",
            content: fullResponse,
          },
        ];
        const newSuggestions = await fetchSuggestionsAsync(updatedChatHistory);
        if (newSuggestions.length > 0) {
          setSuggestions(newSuggestions);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    } catch (error) {
      setIsStreaming(false);
      console.error("Chat error:", error);
      let errorMessage = t("chat.errorMessages.failedToGetResponse");

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      notifications.show({
        title: t("common.error"),
        message: errorMessage,
        color: "red",
      });

      // Remove the empty bot message and add error message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== botMessageId);
        return [
          ...filtered,
          {
            id: (Date.now() + 1).toString(),
            text: t("chat.errorMessages.generic"),
            sender: "bot",
            timestamp: new Date(),
          },
        ];
      });
    }
  };

  const handleFileUpload = (file: File | null) => {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      notifications.show({
        title: t("chat.errorMessages.invalidFileType"),
        message: t("chat.errorMessages.invalidFileTypeMessage"),
        color: "red",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notifications.show({
        title: t("chat.errorMessages.fileTooLarge"),
        message: t("chat.errorMessages.fileTooLargeMessage"),
        color: "red",
      });
      return;
    }

    setSelectedFile(file);
    notifications.show({
      title: t("chat.errorMessages.fileAttached"),
      message: t("chat.errorMessages.fileAttachedMessage", {
        fileName: file.name,
      }),
      color: "green",
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSuggestions((prev) => prev.filter((s) => s !== suggestion));
  };

  const handleDownloadDraft = useCallback(
    async (markdownContent: string, messageId: string) => {
      try {
        const messageIndex = messages.findIndex((msg) => msg.id === messageId);
        const previousUserMessage = messages
          .slice(0, messageIndex)
          .reverse()
          .find((msg) => msg.sender === "user");

        const documentType = previousUserMessage
          ? getDraftType(previousUserMessage.text)
          : "document";

        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `${documentType}_${timestamp}.docx`;

        const blob = await convertMarkdownToDocx(markdownContent);
        downloadDocx(blob, filename);

        notifications.show({
          title: t("chat.download.success"),
          message: t("chat.download.successMessage", {
            filename,
          }),
          color: "green",
        });
      } catch (error) {
        console.error("Error downloading draft:", error);
        notifications.show({
          title: t("common.error"),
          message: t("chat.download.error"),
          color: "red",
        });
      }
    },
    [
      messages,
      t,
    ]
  );

  return {
    messages,
    inputValue,
    setInputValue,
    selectedFile,
    isExtractingPdf,
    isParsingReddit,
    isStreaming,
    suggestions,
    tone,
    setTone,
    listening,
    browserSupportsSpeechRecognition,
    handleSend,
    handleFileUpload,
    handleSuggestionClick,
    handleMicClick,
    handleDownloadDraft,
    parseRedditUrl,
    resetRef,
  };
}
