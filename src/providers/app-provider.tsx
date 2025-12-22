"use client";
import { createTheme, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type React from "react";
import { I18nProvider } from "./i18n-provider";
import { QueryProvider } from "./query-provider";

// Styles
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

interface AppProviderProps {
  children: React.ReactNode;
}

const theme = createTheme({
  fontFamily: "var(--font-nunito), sans-serif",
  primaryColor: "green",
});

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <QueryProvider>
      <I18nProvider>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <ModalsProvider>
            <Notifications autoClose={4000} position="top-right" />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </I18nProvider>
    </QueryProvider>
  );
};
