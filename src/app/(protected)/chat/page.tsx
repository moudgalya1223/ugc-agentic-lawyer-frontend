"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  FileButton,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  rem,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
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
import { useChat, useChatSuggestions } from "@/api/hooks";
import { useTranslation } from "@/i18n";
import { useLocalStore } from "@/store";
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
  const [previewData, setPreviewData] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(null);
  const { sendChatAsync, isLoadingChat } = useChat();
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
    isLoadingChat,
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

    try {
      // Convert messages to ChatMessage format for API
      const chatMessages: ChatMessageType[] = messages
        .filter((msg) => msg.sender !== "bot" || msg.text)
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        }));

      // Add current user message
      chatMessages.push({
        role: "user",
        content: hasFile
          ? `${userMessageText}\n\n${t("chat.fileAttachment.userAttachedFile", {
              fileName,
            })}`
          : userMessageText,
      });

      const response = await sendChatAsync({
        messages: chatMessages,
        language: preferredLanguage || "en",
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: response.message,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);

      // Fetch suggestions after bot reply with updated chat history
      try {
        const updatedChatHistory: ChatMessageType[] = [
          ...chatMessages,
          {
            role: "assistant",
            content: response.message,
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
      console.error("Chat error:", error);
      let errorMessage = t("chat.errorMessages.failedToGetResponse");

      // Handle axios errors
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null
      ) {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
              success?: boolean;
            };
            status?: number;
            statusText?: string;
          };
          message?: string;
        };

        if (
          axiosError.response?.data &&
          typeof axiosError.response.data === "object" &&
          "message" in axiosError.response.data &&
          typeof axiosError.response.data.message === "string"
        ) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        } else if (axiosError.response?.statusText) {
          errorMessage = `${axiosError.response.statusText} (${axiosError.response.status})`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      notifications.show({
        title: t("common.error"),
        message: errorMessage,
        color: "red",
      });
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: t("chat.errorMessages.generic"),
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
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
              {isLoadingChat && (
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
                  <Group gap="xs">
                    <IconFileText
                      size={20}
                      color="var(--mantine-color-green-7)"
                    />
                    <Text size="xs" fw={500}>
                      {selectedFile.name}
                    </Text>
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
                        resetRef.current?.();
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            )}
            {((isFirstChat && defaultPrompts.length > 0) ||
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
                disabled={!inputValue.trim() && !selectedFile}
              >
                <IconSend size={20} />
              </ActionIcon>
            </Group>
          </Box>
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
