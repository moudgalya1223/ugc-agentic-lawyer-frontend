import { Container } from "@mantine/core";
import {
  LawyerCTASection,
  LawyerFeaturesSection,
  LawyerHeroSection,
  ThemeToggle,
} from "./_components";

export default function Home() {
  return (
    <Container size="lg" py={50}>
      <ThemeToggle />
      <LawyerHeroSection />
      <LawyerFeaturesSection />
      <LawyerCTASection />
    </Container>
  );
}
