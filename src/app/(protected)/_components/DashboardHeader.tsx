"use client";

import {
  ActionIcon,
  Avatar,
  Box,
  Burger,
  Group,
  Menu,
  Select,
  Text,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconLogout,
  IconMoon,
  IconRobot,
  IconSettings,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { SUPPORTED_LANGUAGES, useTranslation } from "@/i18n";
import { useLocalStore } from "@/store";
import { APP_VERSION } from "@/utils/constants";

interface DashboardHeaderProps {
  onBurgerClick: () => void;
  drawerOpened: boolean;
}

// Convert SUPPORTED_LANGUAGES to Select format
const LANGUAGES = SUPPORTED_LANGUAGES.map((lang) => ({
  value: lang.code,
  label: `${lang.nativeLabel} (${lang.label})`,
}));

export function DashboardHeader({
  onBurgerClick,
  drawerOpened,
}: DashboardHeaderProps) {
  const { setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const theme = useMantineTheme();
  const { preferredLanguage, setPreferredLanguage } = useLocalStore();
  const { i18n, t } = useTranslation();

  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const handleLanguageChange = (value: string | null) => {
    if (value) {
      setPreferredLanguage(value);
      i18n.changeLanguage(value);
    }
  };

  return (
    <Box h="100%" px="md">
      <Group h="100%" justify="space-between">
        <Group gap="md">
          {isMobile && (
            <Burger
              opened={drawerOpened}
              onClick={onBurgerClick}
              size="sm"
              aria-label={t("dashboard.header.toggleNavigation")}
            />
          )}
          <UnstyledButton component={Link} href="/chat">
            <Group gap="xs">
              <IconRobot size={28} stroke={1.5} />
              <Text fw={700} size="xl">
                Agentic Lawyer
              </Text>
              <Text size="sm" c="dimmed">
                v{APP_VERSION}
              </Text>
            </Group>
          </UnstyledButton>
        </Group>

        <Group gap="sm">
          {!isMobile && (
            <>
              <Select
                value={i18n.language || preferredLanguage}
                onChange={handleLanguageChange}
                data={LANGUAGES}
                size="sm"
                w={250}
                radius="md"
              />
              <ActionIcon
                onClick={() =>
                  setColorScheme(
                    computedColorScheme === "light" ? "dark" : "light"
                  )
                }
                variant="default"
                size="lg"
                radius="md"
                aria-label={t("dashboard.header.toggleColorScheme")}
              >
                {computedColorScheme === "dark" ? (
                  <IconSun stroke={1.5} size={20} />
                ) : (
                  <IconMoon stroke={1.5} size={20} />
                )}
              </ActionIcon>
            </>
          )}

          <Menu shadow="md" width={200} position="bottom-end" radius="md">
            <Menu.Target>
              <UnstyledButton>
                <Avatar radius="md">U</Avatar>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              {isMobile && (
                <>
                  <Menu.Label>{t("common.language")}</Menu.Label>
                  <Box px="xs" pb="xs">
                    <Select
                      value={i18n.language || preferredLanguage}
                      onChange={handleLanguageChange}
                      data={LANGUAGES}
                      size="sm"
                      radius="md"
                      searchable
                    />
                  </Box>
                  <Menu.Divider />
                  <Menu.Label>{t("common.theme")}</Menu.Label>
                  <Menu.Item
                    onClick={() =>
                      setColorScheme(
                        computedColorScheme === "light" ? "dark" : "light"
                      )
                    }
                    leftSection={
                      computedColorScheme === "dark" ? (
                        <IconSun size={16} />
                      ) : (
                        <IconMoon size={16} />
                      )
                    }
                  >
                    {computedColorScheme === "dark"
                      ? t("common.lightMode")
                      : t("common.darkMode")}
                  </Menu.Item>
                  <Menu.Divider />
                </>
              )}
              <Menu.Label>{t("common.account")}</Menu.Label>
              <Menu.Item leftSection={<IconUser size={16} />}>
                {t("common.profile")}
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings size={16} />}>
                {t("common.settings")}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={16} />}>
                {t("common.logout")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
}
