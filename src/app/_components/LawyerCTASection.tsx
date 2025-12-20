"use client";
import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowRight, IconRobot } from "@tabler/icons-react";
import Link from "next/link";

export function LawyerCTASection() {
  return (
    <Container size="lg" py={80}>
      <Paper
        withBorder
        shadow="sm"
        radius="lg"
        p="xl"
        bg="var(--mantine-primary-color-filled)"
      >
        <Stack align="center" gap="lg" p="xl">
          <IconRobot size={64} stroke={1.5} />
          <Title order={2} size="2.5rem" ta="center">
            Ready to Get Started?
          </Title>
          <Text size="lg" ta="center" maw={600} opacity={0.95}>
            Join thousands of users who trust Agentic Lawyer for their legal
            document analysis and legal questions. Start your first analysis
            today.
          </Text>
          <Group justify="center" mt="md">
            <Button
              component={Link}
              href="/chat"
              size="lg"
              variant="white"
              rightSection={<IconArrowRight size={20} />}
            >
              Start Chatting Now
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
