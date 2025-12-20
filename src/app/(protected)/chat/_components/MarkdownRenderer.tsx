"use client";

import { Anchor, Blockquote, Box, Code, Text } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
        remarkPlugins={[
          remarkGfm,
        ]}
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
              mb="md"
              style={{
                overflowX: "auto",
                width: "100%",
              }}
            >
              <Box
                component="table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  borderSpacing: 0,
                }}
              >
                {children}
              </Box>
            </Box>
          ),
          thead: ({ children }) => (
            <Box
              component="thead"
              style={{
                backgroundColor: "rgba(148, 163, 184, 0.1)",
              }}
            >
              {children}
            </Box>
          ),
          tbody: ({ children }) => <Box component="tbody">{children}</Box>,
          tr: ({ children }) => (
            <Box
              component="tr"
              style={{
                borderBottom: "1px solid rgba(148, 163, 184, 0.3)",
              }}
            >
              {children}
            </Box>
          ),
          th: ({ children }) => (
            <Box
              component="th"
              p="sm"
              style={{
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderBottom: "2px solid rgba(148, 163, 184, 0.5)",
                textAlign: "left",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: textColor,
              }}
            >
              {children}
            </Box>
          ),
          td: ({ children }) => (
            <Box
              component="td"
              p="sm"
              style={{
                border: "1px solid rgba(148, 163, 184, 0.3)",
                fontSize: "0.875rem",
                color: textColor,
                verticalAlign: "top",
              }}
            >
              {children}
            </Box>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
