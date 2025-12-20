"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Container,
  FileButton,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  rem,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { convertMarkdownToDocx, downloadDocx } from "@mohtasham/md-to-docx";
import {
  IconDownload,
  IconEye,
  IconFileText,
  IconMicrophone,
  IconPaperclip,
  IconRobot,
  IconSend,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import type { ChatMessage as ChatMessageType } from "@/api/hooks";
import { streamChat, useChatSuggestions } from "@/api/hooks";
import { useTranslation } from "@/i18n";
import { useLocalStore } from "@/store";
import { extractTextFromPDF } from "@/utils/pdf.utils";
import { MarkdownRenderer } from "./_components/MarkdownRenderer";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  file?: {
    name: string;
    url: string;
  };
  isDraft?: boolean; // Flag to indicate if this is a draft document
}

const Chat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: t("chat.welcomeMessage"),
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [tone, setTone] = useState<"lawyer" | "normal">("normal");
  const viewport = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(null);
  const { preferredLanguage } = useLocalStore();

  const { mutateAsync: fetchSuggestionsAsync } = useChatSuggestions();

  // Default prompts for first chat
  const defaultPrompts = [
    t("chat.defaultPrompts.contractAct"),
    t("chat.defaultPrompts.filingCase"),
    t("chat.defaultPrompts.consumerRights"),
    t("chat.defaultPrompts.criminalOffenses"),
    t("chat.defaultPrompts.propertyRegistration"),
  ];

  // Check if it's the first chat (only initial bot message exists)
  const isFirstChat = messages.length === 1 && messages[0]?.sender === "bot";

  // Update welcome message when language changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only update welcome message when language changes
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
    t,
  ]);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const scrollToBottom = useCallback(() => {
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: "auto",
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom should run when messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [
    messages,
    isStreaming,
  ]);

  const openFilePreview = useCallback(
    (fileUrl: string, fileName: string) => {
      setPreviewData({
        url: fileUrl,
        name: fileName,
      });
      open();
    },
    [
      open,
    ]
  );

  const handleSend = async () => {
    if (!inputValue.trim() && !selectedFile) {
      return;
    }

    const userMessageText = inputValue.trim();
    const hasFile = !!selectedFile;
    const fileName = selectedFile?.name || "";
    let extractedPdfText = "";

    // Extract text from PDF if file is attached
    if (selectedFile && selectedFile.type === "application/pdf") {
      try {
        // Set loading state for PDF extraction
        setIsExtractingPdf(true);

        extractedPdfText = await extractTextFromPDF(selectedFile);

        // Clear loading state
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

    // Build user message content with PDF text if available
    let userMessageContent = userMessageText;

    if (hasFile) {
      if (extractedPdfText) {
        // Include extracted PDF text in the message
        userMessageContent = `${userMessageText || "Please analyze this document"}\n\n${t(
          "chat.fileAttachment.userAttachedFile",
          {
            fileName,
          }
        )}\n\n${t("chat.fileAttachment.documentContent")}:\n\n${extractedPdfText}`;
      } else {
        // Fallback if extraction failed but file exists
        userMessageContent = `${userMessageText}\n\n${t(
          "chat.fileAttachment.userAttachedFile",
          {
            fileName,
          }
        )}`;
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
      isDraft, // Mark as draft if user requested a draft
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
          // Update the bot message with the accumulated response
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
        }
      );

      setIsStreaming(false);

      // Fetch suggestions after bot reply with updated chat history
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
        // Continue without updating suggestions
      }
    } catch (error) {
      setIsStreaming(false);
      console.error("Chat error:", error);
      let errorMessage = t("chat.errorMessages.failedToGetResponse");

      // Handle fetch errors
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

  /**
   * Check if a message text contains draft request keywords
   */
  const isDraftRequest = useCallback((text: string): boolean => {
    const content = text.toLowerCase();
    const draftKeywords = [
      "draft",
      "generate",
      "create",
      "prepare",
      "write",
      "make",
      "form",
      "document",
      "notice",
      "agreement",
      "contract",
      "petition",
      "application",
      "affidavit",
      "legal notice",
      "cease and desist",
      "demand letter",
      "complaint",
      "reply",
      "response",
    ];
    return draftKeywords.some((keyword) => content.includes(keyword));
  }, []);

  /**
   * Get document type from message text
   */
  const getDraftType = useCallback((text: string): string => {
    const content = text.toLowerCase();
    const draftTypes: Record<string, string[]> = {
      notice: [
        "notice",
        "legal notice",
        "demand notice",
        "show cause notice",
      ],
      agreement: [
        "agreement",
        "contract",
        "memorandum of understanding",
        "mou",
      ],
      contract: [
        "contract",
        "agreement",
      ],
      petition: [
        "petition",
        "writ petition",
        "civil petition",
      ],
      application: [
        "application",
        "request",
      ],
      affidavit: [
        "affidavit",
        "sworn statement",
      ],
      complaint: [
        "complaint",
        "fir",
        "first information report",
      ],
      reply: [
        "reply",
        "response",
        "rebuttal",
      ],
      letter: [
        "letter",
        "demand letter",
        "cease and desist",
      ],
    };

    for (const [type, keywords] of Object.entries(draftTypes)) {
      if (keywords.some((keyword) => content.includes(keyword))) {
        return type;
      }
    }

    return "document";
  }, []);

  /**
   * Download markdown content as DOCX file
   */
  const handleDownloadDraft = useCallback(
    async (markdownContent: string, messageId: string) => {
      try {
        // Get the previous user message to determine document type
        const messageIndex = messages.findIndex((msg) => msg.id === messageId);
        const previousUserMessage = messages
          .slice(0, messageIndex)
          .reverse()
          .find((msg) => msg.sender === "user");

        const documentType = previousUserMessage
          ? getDraftType(previousUserMessage.text)
          : "document";

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `${documentType}_${timestamp}.docx`;

        // Convert markdown to DOCX blob
        const blob = await convertMarkdownToDocx(markdownContent);

        // Download the DOCX file
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
      getDraftType,
      t,
    ]
  );

  return (
    <Container size="xl" h="calc(100vh - 60px)" p="md">
      <Paper withBorder shadow="sm" radius="lg" h="100%" display="flex" p="md">
        <Flex direction={"column"} w="100%">
          {/* Messages Area */}
          <ScrollArea viewportRef={viewport} flex={1} offsetScrollbars>
            <Stack gap="lg">
              {messages.map((message) => (
                <Group
                  key={message.id}
                  justify={
                    message.sender === "user" ? "flex-end" : "flex-start"
                  }
                  align="flex-start"
                  gap="sm"
                >
                  {message.sender === "bot" && (
                    <Avatar radius="xl" size="md">
                      <IconRobot size={22} />
                    </Avatar>
                  )}

                  <Stack
                    gap={4}
                    align={
                      message.sender === "user" ? "flex-end" : "flex-start"
                    }
                  >
                    <Paper
                      p="sm"
                      radius="lg"
                      bg={
                        message.sender === "user"
                          ? "var(--mantine-color-disabled)"
                          : "var(--mantine-primary-color-filled)"
                      }
                      withBorder={message.sender === "bot"}
                      shadow="xs"
                      maw={700}
                    >
                      {message.file && (
                        <Paper withBorder p="xs" radius="lg">
                          <Flex gap="xs">
                            <Group gap="xs" flex={1}>
                              <IconFileText size={20} />
                              <Text size="xs" fw={500} truncate maw={200}>
                                {message.file?.name}
                              </Text>
                            </Group>
                            <Button
                              variant="subtle"
                              size="compact-xs"
                              radius="lg"
                              leftSection={<IconEye size={14} />}
                              onClick={() => {
                                if (message.file) {
                                  openFilePreview(
                                    message.file.url,
                                    message.file.name
                                  );
                                }
                              }}
                            >
                              {t("common.view")}
                            </Button>
                          </Flex>
                        </Paper>
                      )}
                      {message.text ? (
                        message.sender === "bot" ? (
                          <MarkdownRenderer
                            content={message.text}
                            textColor="white"
                          />
                        ) : (
                          <Text size="sm" lh={1.5}>
                            {message.text}
                          </Text>
                        )
                      ) : null}
                    </Paper>
                    {message.sender === "bot" &&
                      message.isDraft &&
                      message.text && (
                        <Group gap="xs" mt="xs">
                          <Tooltip label={t("chat.download.tooltip")}>
                            <Button
                              variant="light"
                              size="compact-xs"
                              radius="lg"
                              leftSection={<IconDownload size={14} />}
                              onClick={() =>
                                handleDownloadDraft(message.text, message.id)
                              }
                            >
                              {t("chat.download.button")}
                            </Button>
                          </Tooltip>
                        </Group>
                      )}
                    <Text size="calc(10rem / 16)" c="dimmed" px="xs">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Stack>

                  {message.sender === "user" && (
                    <Avatar radius="xl" size="md">
                      <IconUser size={22} />
                    </Avatar>
                  )}
                </Group>
              ))}
              {isStreaming && (
                <Group justify="flex-start" align="flex-start" gap="sm">
                  <Avatar radius="xl" size="md">
                    <IconRobot size={22} />
                  </Avatar>
                  <Stack gap={4} align="flex-start">
                    <Paper
                      p="sm"
                      radius="lg"
                      bg="var(--mantine-primary-color-filled)"
                      withBorder
                      shadow="xs"
                      maw={500}
                    >
                      <Group gap="xs">
                        <Loader type="dots" size={20} color="white" />
                        <Text size="sm" c="white">
                          {t("common.thinking")}
                        </Text>
                      </Group>
                    </Paper>
                  </Stack>
                </Group>
              )}
            </Stack>
          </ScrollArea>

          {/* Input Area */}
          <Box p="md">
            {selectedFile && (
              <Paper withBorder p="xs" mb="xs" radius="lg">
                <Group justify="space-between">
                  <Group gap="xs" flex={1}>
                    <IconFileText
                      size={20}
                      color="var(--mantine-color-green-7)"
                    />
                    <Text size="xs" fw={500} truncate flex={1}>
                      {selectedFile.name}
                    </Text>
                    {isExtractingPdf && (
                      <Group gap="xs">
                        <Loader size="xs" />
                        <Text size="xs" c="dimmed">
                          {t("chat.fileAttachment.extractingText")}
                        </Text>
                      </Group>
                    )}
                  </Group>
                  <Group gap="xs">
                    <Button
                      variant="subtle"
                      size="compact-xs"
                      radius="lg"
                      onClick={() =>
                        openFilePreview(
                          URL.createObjectURL(selectedFile),
                          selectedFile.name
                        )
                      }
                      leftSection={<IconEye size={14} />}
                      disabled={isExtractingPdf}
                    >
                      {t("common.preview")}
                    </Button>
                    <ActionIcon
                      variant="subtle"
                      color="red.6"
                      size="sm"
                      radius="lg"
                      onClick={() => {
                        setSelectedFile(null);
                        setIsExtractingPdf(false);
                        resetRef.current?.();
                      }}
                      disabled={isExtractingPdf}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            )}
            {!selectedFile &&
              ((isFirstChat && defaultPrompts.length > 0) ||
                (suggestions.length > 0 && !isFirstChat)) &&
              !inputValue && (
                <Box mb="sm">
                  <Text size="xs" c="dimmed" mb="xs" fw={500}>
                    {isFirstChat
                      ? t("chat.getStartedWith")
                      : t("chat.suggestions")}
                  </Text>
                  <Flex gap="xs" wrap="wrap">
                    {(isFirstChat ? defaultPrompts : suggestions).map(
                      (suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="light"
                          size="md"
                          style={{
                            cursor: "pointer",
                          }}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      )
                    )}
                  </Flex>
                </Box>
              )}
            <Group gap="xs">
              <SegmentedControl
                value={tone}
                onChange={(value) => setTone(value as "lawyer" | "normal")}
                data={[
                  {
                    label: t("chat.tone.normal"),
                    value: "normal",
                  },
                  {
                    label: t("chat.tone.lawyer"),
                    value: "lawyer",
                  },
                ]}
                size="sm"
                radius="lg"
              />
              <TextInput
                placeholder={t("chat.placeholder")}
                flex={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                radius="lg"
                size="md"
              />
              <FileButton
                resetRef={resetRef}
                onChange={handleFileUpload}
                accept="application/pdf"
              >
                {(props) => (
                  <Tooltip label={t("chat.tooltips.uploadPdf")}>
                    <ActionIcon
                      {...props}
                      variant="light"
                      size="md"
                      h={rem(42)}
                      w={rem(42)}
                      radius="lg"
                    >
                      <IconPaperclip size={20} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </FileButton>
              {mounted &&
                (!browserSupportsSpeechRecognition ? (
                  <Tooltip label={t("chat.tooltips.speechNotSupported")}>
                    <ActionIcon
                      size="md"
                      h={rem(42)}
                      w={rem(42)}
                      radius="lg"
                      variant="light"
                      color="gray"
                      disabled
                    >
                      <IconMicrophone size={20} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Tooltip
                    label={
                      listening
                        ? t("chat.tooltips.stopListening")
                        : t("chat.tooltips.startVoiceInput")
                    }
                  >
                    <ActionIcon
                      size="md"
                      h={rem(42)}
                      w={rem(42)}
                      radius="lg"
                      variant={listening ? "filled" : "light"}
                      color={listening ? "red" : "blue"}
                      onClick={handleMicClick}
                    >
                      {listening ? (
                        <Loader type="dots" size={20} color="white" />
                      ) : (
                        <IconMicrophone size={20} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                ))}
              <ActionIcon
                size="md"
                h={rem(42)}
                w={rem(42)}
                radius="lg"
                variant="filled"
                onClick={handleSend}
                disabled={
                  (!inputValue.trim() && !selectedFile) || isExtractingPdf
                }
              >
                <IconSend size={20} />
              </ActionIcon>
            </Group>
          </Box>
          <Center>
            <Text size="xs" c="dimmed" mt="xs">
              Disclaimer: This is an AI product and not a substitute for legal
              advice. Please consult a licensed attorney for legal advice.
            </Text>
          </Center>
        </Flex>
      </Paper>

      <Modal
        opened={opened}
        onClose={close}
        title={previewData?.name}
        size="xl"
        radius="lg"
      >
        {previewData && (
          <Box h="70vh">
            <iframe
              src={previewData.url}
              title={previewData.name}
              width="100%"
              height="100%"
              style={{
                border: "none",
              }}
            />
          </Box>
        )}
      </Modal>
    </Container>
  );
};

export default Chat;
