"use client";

import { Anchor, Blockquote, Box, Code, Text } from "@mantine/core";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  textColor?: string;
}

export function MarkdownRenderer({
  content,
  textColor = "white",
}: MarkdownRendererProps) {
  return (
    <Box>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <Text size="sm" lh={1.5} mb="xs" c={textColor}>
              {children}
            </Text>
          ),
          h1: ({ children }) => (
            <Text size="xl" fw={700} mb="sm" c={textColor}>
              {children}
            </Text>
          ),
          h2: ({ children }) => (
            <Text size="lg" fw={600} mb="xs" c={textColor}>
              {children}
            </Text>
          ),
          h3: ({ children }) => (
            <Text size="md" fw={600} mb="xs" c={textColor}>
              {children}
            </Text>
          ),
          ul: ({ children }) => (
            <Box component="ul" mb="xs" pl="lg">
              {children}
            </Box>
          ),
          ol: ({ children }) => (
            <Box component="ol" mb="xs" pl="lg">
              {children}
            </Box>
          ),
          li: ({ children }) => (
            <Text size="sm" component="li" c={textColor}>
              {children}
            </Text>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <Code c={textColor}>{children}</Code>
            ) : (
              <Box component="pre" p="xs" mb="xs">
                <Code block c={textColor}>
                  {children}
                </Code>
              </Box>
            );
          },
          blockquote: ({ children }) => (
            <Blockquote color="violet">{children}</Blockquote>
          ),
          strong: ({ children }) => (
            <Text component="strong" fw={700} c={textColor}>
              {children}
            </Text>
          ),
          em: ({ children }) => (
            <Text component="em" fs="italic" c={textColor}>
              {children}
            </Text>
          ),
          a: ({ children, href }) => (
            <Anchor
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              c="blue.2"
            >
              {children}
            </Anchor>
          ),
          table: ({ children }) => (
            <Box
              component="table"
              mb="md"
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              {children}
            </Box>
          ),
          thead: ({ children }) => <Box component="thead">{children}</Box>,
          tbody: ({ children }) => <Box component="tbody">{children}</Box>,
          tr: ({ children }) => <Box component="tr">{children}</Box>,
          th: ({ children }) => (
            <Text
              component="th"
              size="sm"
              fw={600}
              p="xs"
              style={{
                border: "1px solid",
                borderColor: "var(--mantine-color-gray-4)",
                textAlign: "left",
              }}
              c={textColor}
            >
              {children}
            </Text>
          ),
          td: ({ children }) => (
            <Text
              component="td"
              size="sm"
              p="xs"
              style={{
                border: "1px solid",
                borderColor: "var(--mantine-color-gray-4)",
              }}
              c={textColor}
            >
              {children}
            </Text>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
