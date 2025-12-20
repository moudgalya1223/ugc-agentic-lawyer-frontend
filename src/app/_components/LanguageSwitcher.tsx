"use client";
import { Button, Group, Menu } from "@mantine/core";
import { IconLanguage } from "@tabler/icons-react";
import { SUPPORTED_LANGUAGES, useTranslation } from "@/i18n";
import { useLocalStore } from "@/store/useLocalStore";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { setPreferredLanguage } = useLocalStore();

  const handleLanguageChange = (locale: string) => {
    i18n.changeLanguage(locale);
    setPreferredLanguage(locale);
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button
          variant="subtle"
          leftSection={<IconLanguage size={18} />}
          size="sm"
        >
          {currentLanguage.nativeLabel}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Menu.Item
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={i18n.language === lang.code}
          >
            <Group gap="xs">
              <span>{lang.nativeLabel}</span>
              <span
                style={{
                  opacity: 0.6,
                  fontSize: "0.875rem",
                }}
              >
                ({lang.label})
              </span>
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
