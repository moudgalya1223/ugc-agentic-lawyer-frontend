"use client";

import {
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconDownload,
  IconEye,
  IconFileText,
  IconRobot,
  IconUser,
} from "@tabler/icons-react";
import type { ResponseMetadata } from "@/api/hooks";
import { useTranslation } from "@/i18n";
import { MarkdownRenderer } from "./MarkdownRenderer";

export interface MessageBubbleProps {
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
  onFilePreview?: (url: string, name: string) => void;
  onDownloadDraft?: (content: string, messageId: string) => void;
}

export function MessageBubble({
  id,
  text,
  sender,
  timestamp,
  file,
  isDraft,
  metadata,
  onFilePreview,
  onDownloadDraft,
}: MessageBubbleProps) {
  const { t } = useTranslation();

  return (
    <Group
      justify={sender === "user" ? "flex-end" : "flex-start"}
      align="flex-start"
      gap="sm"
    >
      {sender === "bot" && (
        <Avatar radius="xl" size="md">
          <IconRobot size={22} />
        </Avatar>
      )}

      <Stack gap={4} align={sender === "user" ? "flex-end" : "flex-start"}>
        <Paper
          p="sm"
          radius="lg"
          bg={
            sender === "user"
              ? "var(--mantine-color-disabled)"
              : "var(--mantine-primary-color-filled)"
          }
          withBorder={sender === "bot"}
          shadow="xs"
          maw={700}
        >
          {file && (
            <Paper withBorder p="xs" radius="lg" mb="xs">
              <Group gap="xs" justify="space-between">
                <Group gap="xs" flex={1}>
                  <IconFileText size={20} />
                  <Text size="xs" fw={500} truncate maw={200}>
                    {file.name}
                  </Text>
                </Group>
                {onFilePreview && (
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    radius="lg"
                    leftSection={<IconEye size={14} />}
                    onClick={() => onFilePreview(file.url, file.name)}
                  >
                    {t("common.view")}
                  </Button>
                )}
              </Group>
            </Paper>
          )}
          {text ? (
            sender === "bot" ? (
              <MarkdownRenderer content={text} textColor="white" />
            ) : (
              <Text size="sm" lh={1.5}>
                {text}
              </Text>
            )
          ) : null}
        </Paper>

        {sender === "bot" && metadata && (
          <Group gap="xs" mt="xs" wrap="wrap">
            <Tooltip label="Confidence Level">
              <Badge
                variant="light"
                color={
                  metadata.confidence === "high"
                    ? "green"
                    : metadata.confidence === "medium"
                      ? "yellow"
                      : "red"
                }
                size="sm"
              >
                Confidence: {metadata.confidence.toUpperCase()}
              </Badge>
            </Tooltip>
            <Tooltip label="Legal Category">
              <Badge variant="light" color="blue" size="sm">
                Legal Category:{" "}
                {metadata.legalCategory.charAt(0).toUpperCase() +
                  metadata.legalCategory.slice(1)}
              </Badge>
            </Tooltip>
            <Tooltip label="Jurisdiction">
              <Badge variant="light" color="violet" size="sm">
                Jurisdiction:{" "}
                {metadata.jurisdiction === "national"
                  ? "National"
                  : metadata.jurisdiction === "state_specific"
                    ? "State Specific"
                    : "Union Territory"}
              </Badge>
            </Tooltip>
            {metadata.timeSensitivity !== "normal" && (
              <Tooltip label="Time Sensitivity">
                <Badge
                  variant="light"
                  color={
                    metadata.timeSensitivity === "immediate"
                      ? "red"
                      : metadata.timeSensitivity === "urgent"
                        ? "orange"
                        : "gray"
                  }
                  size="sm"
                >
                  Time Sensitivity:{" "}
                  {metadata.timeSensitivity === "immediate"
                    ? "Immediate"
                    : metadata.timeSensitivity === "urgent"
                      ? "Urgent"
                      : "No Action Needed"}
                </Badge>
              </Tooltip>
            )}
          </Group>
        )}

        {sender === "bot" && isDraft && text && onDownloadDraft && (
          <Group gap="xs" mt="xs">
            <Tooltip label={t("chat.download.tooltip")}>
              <Button
                variant="light"
                size="compact-xs"
                radius="lg"
                leftSection={<IconDownload size={14} />}
                onClick={() => onDownloadDraft(text, id)}
              >
                {t("chat.download.button")}
              </Button>
            </Tooltip>
          </Group>
        )}

        <Text size="calc(10rem / 16)" c="dimmed" px="xs">
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </Stack>

      {sender === "user" && (
        <Avatar radius="xl" size="md">
          <IconUser size={22} />
        </Avatar>
      )}
    </Group>
  );
}
