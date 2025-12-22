"use client";

import {
  Avatar,
  Box,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconRobot } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n";
import { ChatInput } from "../_components/ChatInput";
import { MessageBubble } from "../_components/MessageBubble";
import type { Message } from "../hooks/useChatLogic";
import { useChatLogic } from "../hooks/useChatLogic";

const ChatIdPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const chatId = params.chatId as string;
  const viewport = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [initialMessages, setInitialMessages] = useState<Message[] | null>(
    null
  );

  // Load messages from sessionStorage on mount
  useEffect(() => {
    setMounted(true);

    // Try to load messages from sessionStorage
    const storageKey = `chat_${chatId}`;
    const storedMessages = sessionStorage.getItem(storageKey);

    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setInitialMessages(messagesWithDates);
      } catch (error) {
        console.error("Error parsing stored messages:", error);
        setInitialMessages([]);
      }
    } else {
      // No stored messages, use empty array to indicate we should use default
      setInitialMessages([]);
    }
  }, [
    chatId,
  ]);

  const {
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
    resetRef,
  } = useChatLogic(
    initialMessages !== null && initialMessages.length > 0
      ? {
          initialMessages,
        }
      : {}
  );

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (mounted && messages.length > 0) {
      const storageKey = `chat_${chatId}`;
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [
    messages,
    chatId,
    mounted,
  ]);

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
    scrollToBottom,
  ]);

  const openFilePreview = (fileUrl: string, fileName: string) => {
    setPreviewData({
      url: fileUrl,
      name: fileName,
    });
    open();
  };

  const handleFileRemove = () => {
    // This will be handled by the hook, but we need to clear the file
    // The hook's handleFileUpload will handle this when file is null
    handleFileUpload(null);
    resetRef.current?.();
  };

  // Show loading state while initializing messages from storage
  if (!mounted || initialMessages === null) {
    return (
      <Container size="xl" h="calc(100vh - 60px)" p="md">
        <Paper
          withBorder
          shadow="sm"
          radius="lg"
          h="100%"
          display="flex"
          p="md"
        >
          <Center w="100%" h="100%">
            <Loader size="lg" />
          </Center>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" h="calc(100vh - 60px)" p="md">
      <Paper withBorder shadow="sm" radius="lg" h="100%" display="flex" p="md">
        <Flex direction="column" w="100%">
          {/* Messages Area */}
          <ScrollArea viewportRef={viewport} flex={1} offsetScrollbars>
            <Stack gap="lg">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  id={message.id}
                  text={message.text}
                  sender={message.sender}
                  timestamp={message.timestamp}
                  file={message.file}
                  isDraft={message.isDraft}
                  metadata={message.metadata}
                  onFilePreview={openFilePreview}
                  onDownloadDraft={handleDownloadDraft}
                />
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
          <ChatInput
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            selectedFile={selectedFile}
            isExtractingPdf={isExtractingPdf}
            isParsingReddit={isParsingReddit}
            isStreaming={isStreaming}
            suggestions={suggestions}
            defaultPrompts={defaultPrompts}
            isFirstChat={isFirstChat}
            tone={tone}
            onToneChange={setTone}
            listening={listening}
            browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
            onMicClick={handleMicClick}
            onFileUpload={handleFileUpload}
            onSuggestionClick={handleSuggestionClick}
            onFilePreview={openFilePreview}
            onFileRemove={handleFileRemove}
            resetRef={resetRef}
            mounted={mounted}
          />

          <Center>
            <Text size="xs" c="dimmed" mt="xs">
              {t("chat.disclaimer")}
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

export default ChatIdPage;
