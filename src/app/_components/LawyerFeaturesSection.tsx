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

import { useTranslation } from "@/i18n";

const getFeatures = (t: (key: string) => string) => [
  {
    icon: IconFileText,
    title: t("features.documentAnalysis.title"),
    description: t("features.documentAnalysis.description"),
    color: "blue",
  },
  {
    icon: IconMessageCircle,
    title: t("features.legalQA.title"),
    description: t("features.legalQA.description"),
    color: "indigo",
  },
  {
    icon: IconMicrophone,
    title: t("features.voiceInput.title"),
    description: t("features.voiceInput.description"),
    color: "violet",
  },
  {
    icon: IconSearch,
    title: t("features.contractReview.title"),
    description: t("features.contractReview.description"),
    color: "grape",
  },
  {
    icon: IconShieldCheck,
    title: t("features.securePrivate.title"),
    description: t("features.securePrivate.description"),
    color: "green",
  },
  {
    icon: IconClock,
    title: t("features.availability.title"),
    description: t("features.availability.description"),
    color: "orange",
  },
];

export function LawyerFeaturesSection() {
  const { t } = useTranslation();
  const features = getFeatures(t);

  return (
    <Container size="lg" py={60}>
      <Stack align="center" gap="xl" mb={60}>
        <Title order={2} size="2.5rem" ta="center">
          {t("features.title")}
        </Title>
        <Text c="dimmed" size="lg" maw={600} ta="center">
          {t("features.subtitle")}
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
