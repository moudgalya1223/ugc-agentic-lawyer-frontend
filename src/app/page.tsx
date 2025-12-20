import { Container, Group } from "@mantine/core";
import {
  LanguageSwitcher,
  LawyerCTASection,
  LawyerFeaturesSection,
  LawyerHeroSection,
  ThemeToggle,
} from "./_components";

export default function Home() {
  return (
    <Container size="lg" py={50}>
      <Group justify="flex-end" mb="md">
        <LanguageSwitcher />
        <ThemeToggle />
      </Group>
      <LawyerHeroSection />
      <LawyerFeaturesSection />
      <LawyerCTASection />
    </Container>
  );
}
