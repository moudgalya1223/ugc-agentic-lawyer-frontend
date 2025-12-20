"use client";
import { useEffect } from "react";
import { DEFAULT_LANGUAGE, i18n, SUPPORTED_LANGUAGES } from "@/i18n";
import { useLocalStore } from "@/store/useLocalStore";

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { preferredLanguage } = useLocalStore();

  useEffect(() => {
    // Validate that preferredLanguage is a supported locale code
    const supportedCodes = SUPPORTED_LANGUAGES.map((lang) => lang.code);
    const locale = supportedCodes.includes(preferredLanguage)
      ? preferredLanguage
      : DEFAULT_LANGUAGE;

    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [
    preferredLanguage,
  ]);

  return <>{children}</>;
}
