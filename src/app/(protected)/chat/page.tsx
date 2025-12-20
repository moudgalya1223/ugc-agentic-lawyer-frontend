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
      text: "Hello! I am your Agentic Lawyer assistant. How can I help you with your legal documents today?",
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
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Analyze this contract for potential risks",
    "Summarize the key terms in this document",
    "Draft a non-disclosure agreement",
  ]);
  const viewport = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(null);

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
    isLoading,
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

  const handleSend = () => {
    if (!inputValue.trim() && !selectedFile) {
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
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
    setIsLoading(true);

    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: newMessage.file
            ? `I've received your document "${newMessage.file.name}". How would you like me to analyze it?`
            : "I'm processing your request. As an AI assistant, I can help you analyze contracts, summarize legal terms, or draft simple agreements. What specifically would you like to do?",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 1000);
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
                      maw={500}
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
                        <Text size="sm" lh={1.5}>
                          {message.text}
                        </Text>
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
              {isLoading && (
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
            {suggestions.length > 0 && !inputValue && (
              <Box mb="sm">
                <Text size="xs" c="dimmed" mb="xs" fw={500}>
                  Suggestions:
                </Text>
                <Flex gap="xs" wrap="wrap">
                  {suggestions.map((suggestion) => (
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
                  ))}
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
