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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I am your Agentic Lawyer assistant specializing in Indian laws. How can I help you with your legal questions today?",
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

  const { mutateAsync: fetchSuggestionsAsync } = useChatSuggestions();

  // Default prompts for first chat
  const defaultPrompts = [
    "What are the key provisions of the Indian Contract Act?",
    "Explain the procedure for filing a case in Indian courts",
    "What are my rights under the Consumer Protection Act?",
    "How does the Indian Penal Code define criminal offenses?",
    "What is the process for property registration in India?",
  ];

  // Check if it's the first chat (only initial bot message exists)
  const isFirstChat = messages.length === 1 && messages[0]?.sender === "bot";

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
          title: "Permission denied",
          message:
            "Please allow microphone access to use speech-to-text. Check your browser settings if blocked.",
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
          ? `${userMessageText}\n\n[User has attached a file: ${fileName}]`
          : userMessageText,
      });

      const response = await sendChatAsync({
        messages: chatMessages,
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
      let errorMessage = "Failed to get response. Please try again.";

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
        title: "Error",
        message: errorMessage,
        color: "red",
      });
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
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
        title: "Invalid file type",
        message: "Please upload a PDF file.",
        color: "red",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notifications.show({
        title: "File too large",
        message: "File size must be less than 2MB.",
        color: "red",
      });
      return;
    }

    setSelectedFile(file);
    notifications.show({
      title: "File attached",
      message: `${file.name} is ready to be sent.`,
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
                              View
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
                          Thinking...
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
                      Preview
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
                    {isFirstChat ? "Get started with:" : "Suggestions:"}
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
                placeholder="Ask your legal question..."
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
                  <Tooltip label="Upload PDF (max 2MB)">
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
                  <Tooltip label="Speech recognition is not supported in this browser">
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
                    label={listening ? "Stop listening" : "Start voice input"}
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
