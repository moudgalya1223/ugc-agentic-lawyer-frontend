"use client";

import {
  ActionIcon,
  Avatar,
  Box,
  Container,
  Flex,
  Group,
  Paper,
  rem,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconRobot, IconSend, IconUser } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
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
  const viewport = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom should run when messages change
  useEffect(() => {
    scrollToBottom();
  }, [
    messages,
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) {
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [
      ...prev,
      newMessage,
    ]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I'm processing your request. As an AI assistant, I can help you analyze contracts, summarize legal terms, or draft simple agreements. What specifically would you like to do?",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }, 1000);
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
                      bg={message.sender === "user" ? "gray.6" : "green.6"}
                      shadow="xs"
                      maw={500}
                    >
                      <Text size="sm" lh={1.5}>
                        {message.text}
                      </Text>
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
            </Stack>
          </ScrollArea>

          {/* Input Area */}
          <Box p="md">
            <Group gap="xs">
              <TextInput
                placeholder="Ask your legal question..."
                flex={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                radius="md"
                size="md"
              />
              <ActionIcon
                size="md"
                h={rem(42)}
                w={rem(42)}
                radius="md"
                variant="filled"
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                <IconSend size={20} />
              </ActionIcon>
            </Group>
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
};

export default Chat;
