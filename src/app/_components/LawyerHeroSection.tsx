"use client";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight, IconRobot } from "@tabler/icons-react";
import Link from "next/link";

export function LawyerHeroSection() {
  return (
    <Stack align="center" gap="lg" mb={80} py={60}>
      <Group gap="xs" mb="md">
        <IconRobot size={48} stroke={1.5} />
        <Title order={1} size="3rem">
          Agentic Lawyer
        </Title>
      </Group>
      <Text c="dimmed" size="xl" maw={700} ta="center" lh={1.6}>
        Your intelligent legal assistant powered by AI. Analyze contracts,
        review documents, get legal insights, and draft agreements—all in one
        place.
      </Text>

      <Group justify="center" mt="xl">
        <Button
          component={Link}
          href="/chat"
          size="lg"
          leftSection={<IconRobot size={20} />}
          rightSection={<IconArrowRight size={20} />}
        >
          Start Legal Analysis
        </Button>
        <Button component={Link} href="/login" size="lg" variant="light">
          Sign In
        </Button>
      </Group>
    </Stack>
  );
}
