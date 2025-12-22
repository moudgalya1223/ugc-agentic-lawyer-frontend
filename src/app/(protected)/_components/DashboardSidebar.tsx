"use client";

import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  Paper,
  rem,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconDots,
  IconEdit,
  IconHistory,
  IconMessageCircleOff,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/i18n";
import { useChatStore } from "@/store";
import { getRelativeTime } from "@/utils/dayjs.utils";

interface DashboardSidebarProps {
  onItemClick?: () => void;
}

export function DashboardSidebar({ onItemClick }: DashboardSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { getAllChats, deleteChat, updateChatName } = useChatStore();
  const chats = getAllChats();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleDeleteChat = (chatId: string, chatName: string) => {
    modals.openConfirmModal({
      title: t("dashboard.sidebar.deleteChat") || "Delete Chat",
      children: (
        <Text size="sm">
          {t("dashboard.sidebar.deleteChatConfirm", {
            name: chatName,
          }) ||
            `Are you sure you want to delete "${chatName}"? This action cannot be undone.`}
        </Text>
      ),
      labels: {
        confirm: t("common.delete") || "Delete",
        cancel: t("common.cancel") || "Cancel",
      },
      confirmProps: {
        color: "red",
      },
      onConfirm: () => {
        deleteChat(chatId);
        // If we're on the deleted chat page, redirect to new chat
        if (pathname === `/chat/${chatId}`) {
          router.push("/chat");
        }
      },
    });
  };

  const handleStartRename = (chatId: string, currentName: string) => {
    setEditingChatId(chatId);
    setEditName(currentName);
  };

  const handleSaveRename = (chatId: string) => {
    if (editName.trim()) {
      updateChatName(chatId, editName.trim());
    }
    setEditingChatId(null);
    setEditName("");
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setEditName("");
  };

  const isActiveChat = (chatId: string) => pathname === `/chat/${chatId}`;

  return (
    <Stack gap={0} h="100%" p="md">
      <Button
        component={Link}
        href="/chat"
        leftSection={<IconPlus size={18} />}
        variant="light"
        radius="md"
        fullWidth
        mb="xl"
        onClick={onItemClick}
        h={rem(42)}
      >
        {t("dashboard.sidebar.startNewAnalysis")}
      </Button>

      <Divider mb="xl" variant="dashed" />

      <Stack gap={0} flex={1}>
        <Group px="xs" mb="xs" justify="space-between">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            {t("dashboard.sidebar.recentChats")}
          </Text>
          <IconHistory size={14} color="var(--mantine-color-dimmed)" />
        </Group>

        {chats.length === 0 ? (
          <Stack align="center" justify="center" gap="md" flex={1} py="xl">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <IconMessageCircleOff size={32} stroke={1.5} />
            </ThemeIcon>
            <Text size="sm" c="dimmed" ta="center">
              {t("dashboard.sidebar.noRecentChats")}
            </Text>
          </Stack>
        ) : (
          <ScrollArea flex={1} offsetScrollbars>
            <Stack gap="xs">
              {chats.map((chat) => {
                const isActive = isActiveChat(chat.id);
                const isEditing = editingChatId === chat.id;

                return isEditing ? (
                  <Box key={chat.id}>
                    <Paper
                      p="sm"
                      radius="md"
                      withBorder
                      bg={isActive ? "green.7" : undefined}
                    >
                      <Group gap="xs" align="center">
                        <TextInput
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          size="sm"
                          flex={1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveRename(chat.id);
                            } else if (e.key === "Escape") {
                              handleCancelRename();
                            }
                          }}
                          autoFocus
                        />
                        <ActionIcon
                          color="yellow.6"
                          onClick={() => handleSaveRename(chat.id)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon color="red.6" onClick={handleCancelRename}>
                          <IconX size={16} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  </Box>
                ) : (
                  <Box
                    key={chat.id}
                    component={Link}
                    href={`/chat/${chat.id}`}
                    onClick={onItemClick}
                  >
                    <Paper
                      p="sm"
                      radius="md"
                      withBorder
                      bg={isActive ? "green.7" : undefined}
                    >
                      <Group gap="xs" align="flex-start" wrap="nowrap">
                        <Stack gap={2} flex={1} miw={0}>
                          <Tooltip label={chat.name}>
                            <Text
                              size="sm"
                              fw={isActive ? 600 : 500}
                              truncate="end"
                              c={isActive ? "white" : "gray.4"}
                              lineClamp={1}
                            >
                              {chat.name}
                            </Text>
                          </Tooltip>

                          <Text size="xs" c={isActive ? "white" : "gray.4"}>
                            {getRelativeTime(chat.createdAt)}
                          </Text>
                        </Stack>

                        <Menu position="bottom-end" withArrow trigger="click">
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={16} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(chat.id, chat.name);
                              }}
                            >
                              {t("common.rename") || "Rename"}
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={16} />}
                              color="red"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id, chat.name);
                              }}
                            >
                              {t("common.delete") || "Delete"}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Paper>
                  </Box>
                );
              })}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Stack>
  );
}
