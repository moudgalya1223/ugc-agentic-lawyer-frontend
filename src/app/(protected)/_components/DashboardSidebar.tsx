"use client";

import {
  Box,
  Button,
  Divider,
  Group,
  NavLink,
  rem,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconHistory, IconMessage2, IconPlus } from "@tabler/icons-react";
import Link from "next/link";

interface DashboardSidebarProps {
  onItemClick?: () => void;
}

export function DashboardSidebar({ onItemClick }: DashboardSidebarProps) {
  const recentChats = [
    {
      id: "1",
      title: "Employment Agreement Review",
      time: "2h ago",
    },
    {
      id: "2",
      title: "NDA for Tech Startup",
      time: "5h ago",
    },
    {
      id: "3",
      title: "Tenant Dispute Advice",
      time: "Yesterday",
    },
    {
      id: "4",
      title: "Privacy Policy Draft",
      time: "2 days ago",
    },
  ];

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
        Start New Analysis
      </Button>

      <Divider mb="xl" variant="dashed" />

      <Box
        flex={1}
        style={{
          overflow: "hidden",
        }}
        display="flex"
      >
        <Stack gap={0} flex={1}>
          <Group px="xs" mb="xs" justify="space-between">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Recent Chats
            </Text>
            <IconHistory size={14} color="var(--mantine-color-dimmed)" />
          </Group>

          <ScrollArea scrollbarSize={2} offsetScrollbars flex={1}>
            <Stack gap={2}>
              {recentChats.map((chat) => (
                <NavLink
                  key={chat.id}
                  label={chat.title}
                  description={chat.time}
                  onClick={onItemClick}
                  variant="subtle"
                  leftSection={<IconMessage2 size={16} stroke={1.5} />}
                  styles={{
                    root: {
                      borderRadius: "var(--mantine-radius-md)",
                    },
                  }}
                />
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Box>
    </Stack>
  );
}
