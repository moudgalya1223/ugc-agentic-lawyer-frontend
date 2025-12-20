"use client";

import {
  Box,
  Button,
  Divider,
  Group,
  rem,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconHistory,
  IconMessageCircleOff,
  IconPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import { useTranslation } from "@/i18n";

interface DashboardSidebarProps {
  onItemClick?: () => void;
}

export function DashboardSidebar({ onItemClick }: DashboardSidebarProps) {
  const { t } = useTranslation();

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
              {t("dashboard.sidebar.recentChats")}
            </Text>
            <IconHistory size={14} color="var(--mantine-color-dimmed)" />
          </Group>

          <Stack align="center" justify="center" gap="md" flex={1} py="xl">
            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
              <IconMessageCircleOff size={32} stroke={1.5} />
            </ThemeIcon>
            <Text size="sm" c="dimmed" ta="center">
              {t("dashboard.sidebar.noRecentChats")}
            </Text>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
