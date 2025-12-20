"use client";

import { Button } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { useTranslation } from "@/i18n";

export function NotFoundButton() {
  const { t } = useTranslation();
  const handleClick = () => {
    window.location.href = "/";
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      leftSection={<IconHome size={20} />}
      mt="md"
    >
      {t("common.goBackHome")}
    </Button>
  );
}
