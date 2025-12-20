import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AppProvider } from "@/providers/app-provider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: [
    "latin",
  ],
});

export const metadata: Metadata = {
  title: "Agentic Lawyer - Indian Law Assistant",
  description:
    "Expert legal assistant specializing exclusively in Indian laws, legal matters, and legal procedures. Get accurate information about Indian Acts, Statutes, Regulations, case law, and legal procedures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={`${nunito.variable}`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
