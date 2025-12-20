"use client";

import { Anchor, Box, Code, Text } from "@mantine/core";
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
            <Box component="blockquote" pl="md" mb="xs">
              <Text size="sm" c={textColor}>
                {children}
              </Text>
            </Box>
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
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
