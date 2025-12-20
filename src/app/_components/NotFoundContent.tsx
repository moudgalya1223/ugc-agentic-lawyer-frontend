"use client";

import { Container, Flex, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "@/i18n";
import { NotFoundButton } from "./NotFoundButton";

export function NotFoundContent() {
  const { t } = useTranslation();

  return (
    <Flex justify="center" align="center" h="100vh">
      <Container size="sm">
        <Stack gap="xl" align="center" ta="center">
          <ThemeIcon size={120} radius={60} variant="light">
            <IconAlertCircle size={60} stroke={1.5} />
          </ThemeIcon>

          <Stack gap="md" align="center">
            <Title order={1} fw={800} size="4rem">
              {t("notFound.title")}
            </Title>
            <Title order={2} fw={600} size="h3">
              {t("notFound.heading")}
            </Title>
            <Text size="lg" c="dimmed" maw={500}>
              {t("notFound.description")}
            </Text>
          </Stack>

          <NotFoundButton />
        </Stack>
      </Container>
    </Flex>
  );
}
