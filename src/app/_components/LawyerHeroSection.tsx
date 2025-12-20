"use client";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconRobot } from "@tabler/icons-react";
import Link from "next/link";
import { useTranslation } from "@/i18n";

export function LawyerHeroSection() {
  const { t } = useTranslation();

  return (
    <Stack align="center" gap="lg" mb={80} py={60}>
      <Group gap="xs" mb="md">
        <IconRobot size={48} stroke={1.5} />
        <Title order={1} size="3rem">
          {t("hero.title")}
        </Title>
      </Group>
      <Text c="dimmed" size="xl" maw={700} ta="center" lh={1.6}>
        {t("hero.subtitle")}
      </Text>

      <Group justify="center" mt="xl">
        <Button
          component={Link}
          href="/chat"
          size="lg"
          leftSection={<IconRobot size={20} />}
          rightSection={<IconArrowRight size={20} />}
        >
          {t("common.startAnalysis")}
        </Button>
        <Button component={Link} href="/login" size="lg" variant="light">
          {t("common.signIn")}
        </Button>
      </Group>
    </Stack>
  );
}
