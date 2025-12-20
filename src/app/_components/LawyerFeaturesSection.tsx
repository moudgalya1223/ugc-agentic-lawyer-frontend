"use client";
import {
  Container,
  Grid,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconClock,
  IconFileText,
  IconMessageCircle,
  IconMicrophone,
  IconSearch,
  IconShieldCheck,
} from "@tabler/icons-react";

const features = [
  {
    icon: IconFileText,
    title: "Document Analysis",
    description:
      "Upload PDF documents and get instant analysis of contracts, agreements, and legal documents.",
    color: "blue",
  },
  {
    icon: IconMessageCircle,
    title: "Legal Q&A",
    description:
      "Ask any legal question and receive comprehensive answers powered by advanced AI technology.",
    color: "indigo",
  },
  {
    icon: IconMicrophone,
    title: "Voice Input",
    description:
      "Speak your questions naturally using voice-to-text technology for a seamless experience.",
    color: "violet",
  },
  {
    icon: IconSearch,
    title: "Contract Review",
    description:
      "Get detailed reviews of contracts with highlighted risks, key terms, and recommendations.",
    color: "grape",
  },
  {
    icon: IconShieldCheck,
    title: "Secure & Private",
    description:
      "Your documents and conversations are handled with the highest security standards.",
    color: "green",
  },
  {
    icon: IconClock,
    title: "24/7 Availability",
    description:
      "Access legal assistance anytime, anywhere. No appointments needed.",
    color: "orange",
  },
];

export function LawyerFeaturesSection() {
  return (
    <Container size="lg" py={60}>
      <Stack align="center" gap="xl" mb={60}>
        <Title order={2} size="2.5rem" ta="center">
          Powerful Legal Tools at Your Fingertips
        </Title>
        <Text c="dimmed" size="lg" maw={600} ta="center">
          Everything you need to handle legal documents and get answers to your
          legal questions.
        </Text>
      </Stack>

      <Grid gutter="lg">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Grid.Col
              key={feature.title}
              span={{
                base: 12,
                sm: 6,
                md: 4,
              }}
            >
              <Paper shadow="sm" p="lg" radius="md" withBorder h="100%">
                <Stack gap="md">
                  <ThemeIcon
                    color={`var(--mantine-color-${feature.color}-6)`}
                    size={40}
                    radius={"md"}
                  >
                    <Icon stroke={1.5} />
                  </ThemeIcon>
                  <Title order={3} size="h4">
                    {feature.title}
                  </Title>
                  <Text c="dimmed" size="sm" lh={1.6}>
                    {feature.description}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Container>
  );
}
