"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  FileButton,
  Flex,
  Group,
  Loader,
  Paper,
  rem,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconEye,
  IconFileText,
  IconMicrophone,
  IconPaperclip,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect } from "react";
import { useTranslation } from "@/i18n";

export interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  selectedFile: File | null;
  isExtractingPdf: boolean;
  isParsingReddit: boolean;
  isStreaming: boolean;
  suggestions: string[];
  defaultPrompts: string[];
  isFirstChat: boolean;
  tone: "lawyer" | "normal";
  onToneChange: (tone: "lawyer" | "normal") => void;
  listening: boolean;
  browserSupportsSpeechRecognition: boolean;
  onMicClick: () => void;
  onFileUpload: (file: File | null) => void;
  onSuggestionClick: (suggestion: string) => void;
  onFilePreview?: (url: string, name: string) => void;
  onFileRemove: () => void;
  resetRef: React.MutableRefObject<(() => void) | null>;
  mounted: boolean;
}

export function ChatInput({
  inputValue,
  onInputChange,
  onSend,
  selectedFile,
  isExtractingPdf,
  isParsingReddit,
  isStreaming,
  suggestions,
  defaultPrompts,
  isFirstChat,
  tone,
  onToneChange,
  listening,
  browserSupportsSpeechRecognition,
  onMicClick,
  onFileUpload,
  onSuggestionClick,
  onFilePreview,
  onFileRemove,
  resetRef,
  mounted,
}: ChatInputProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const form = useForm({
    initialValues: {
      message: inputValue,
    },
    onValuesChange: (values) => {
      onInputChange(values.message);
    },
  });

  // Sync form value with external inputValue prop (e.g., when set from speech recognition)
  // biome-ignore lint/correctness/useExhaustiveDependencies: form.setFieldValue is stable, only sync when inputValue changes
  useEffect(() => {
    form.setFieldValue("message", inputValue);
  }, [
    inputValue,
  ]);

  const toneSelectorData = [
    {
      label: t("chat.tone.normal"),
      value: "normal",
    },
    {
      label: t("chat.tone.lawyer"),
      value: "lawyer",
    },
  ];

  const inputHeight = isMobile ? rem(36) : rem(42);

  const showSuggestions =
    !selectedFile &&
    ((isFirstChat && defaultPrompts.length > 0) ||
      (suggestions.length > 0 && !isFirstChat)) &&
    !form.values.message;

  const handleSubmit = form.onSubmit(() => {
    if (form.values.message.trim() || selectedFile) {
      onSend();
      // Parent component will reset inputValue, which will sync via useEffect
    }
  });

  const handleSuggestionClickInternal = (suggestion: string) => {
    // Update form and parent - onSuggestionClick will update parent inputValue,
    // which will sync back to form via useEffect
    onSuggestionClick(suggestion);
  };

  return (
    <Box p="md">
      {(selectedFile || isParsingReddit) && (
        <Paper withBorder p="xs" mb="xs" radius="lg">
          <Group justify="space-between">
            <Group gap="xs" flex={1}>
              {selectedFile && (
                <>
                  <IconFileText
                    size={20}
                    color="var(--mantine-color-green-7)"
                  />
                  <Text size="xs" fw={500} truncate flex={1}>
                    {selectedFile.name}
                  </Text>
                  {isExtractingPdf && (
                    <Group gap="xs">
                      <Loader size="xs" />
                      <Text size="xs" c="dimmed">
                        {t("chat.fileAttachment.extractingText")}
                      </Text>
                    </Group>
                  )}
                </>
              )}
              {isParsingReddit && (
                <Group gap="xs">
                  <Loader size="xs" />
                  <Text size="xs" c="dimmed">
                    {t("chat.reddit.parsing") || "Parsing Reddit post..."}
                  </Text>
                </Group>
              )}
            </Group>
            {selectedFile && (
              <Group gap="xs">
                {onFilePreview && (
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    radius="lg"
                    onClick={() =>
                      onFilePreview(
                        URL.createObjectURL(selectedFile),
                        selectedFile.name
                      )
                    }
                    leftSection={<IconEye size={14} />}
                    disabled={isExtractingPdf || isParsingReddit}
                  >
                    {t("common.preview")}
                  </Button>
                )}
                <ActionIcon
                  variant="subtle"
                  color="red.6"
                  size="sm"
                  radius="lg"
                  onClick={onFileRemove}
                  disabled={isExtractingPdf || isParsingReddit}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            )}
          </Group>
        </Paper>
      )}

      {showSuggestions && (
        <Box mb="sm">
          <Text size="xs" c="dimmed" mb="xs" fw={500}>
            {isFirstChat ? t("chat.getStartedWith") : t("chat.suggestions")}
          </Text>
          <Flex gap="xs" wrap="wrap">
            {(isFirstChat ? defaultPrompts : suggestions).map((suggestion) => (
              <Badge
                key={suggestion}
                variant="light"
                size="md"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => handleSuggestionClickInternal(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}

      <Stack gap="xs">
        {isMobile && (
          <Flex align="flex-start">
            <SegmentedControl
              value={tone}
              onChange={(value) => onToneChange(value as "lawyer" | "normal")}
              data={toneSelectorData}
              size="sm"
              radius="lg"
            />
          </Flex>
        )}

        <form onSubmit={handleSubmit}>
          <Flex gap="xs" align="center" wrap="nowrap">
            {!isMobile && (
              <SegmentedControl
                value={tone}
                onChange={(value) => onToneChange(value as "lawyer" | "normal")}
                data={toneSelectorData}
                size="sm"
                radius="lg"
              />
            )}
            <TextInput
              {...form.getInputProps("message")}
              placeholder={t("chat.placeholder")}
              flex={1}
              miw={0}
              radius="lg"
              size={isMobile ? "sm" : "md"}
            />
            <Group gap={isMobile ? "xs" : "sm"} wrap="wrap">
              <FileButton
                resetRef={resetRef}
                onChange={onFileUpload}
                accept="application/pdf"
              >
                {(props) => (
                  <Tooltip label={t("chat.tooltips.uploadPdf")}>
                    <ActionIcon
                      {...props}
                      variant="light"
                      size={isMobile ? "sm" : "md"}
                      h={inputHeight}
                      w={inputHeight}
                      radius="lg"
                    >
                      <IconPaperclip size={isMobile ? 18 : 20} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </FileButton>
              {mounted &&
                (!browserSupportsSpeechRecognition ? (
                  <Tooltip label={t("chat.tooltips.speechNotSupported")}>
                    <ActionIcon
                      size={isMobile ? "sm" : "md"}
                      h={inputHeight}
                      w={inputHeight}
                      radius="lg"
                      variant="light"
                      color="gray"
                      disabled
                    >
                      <IconMicrophone size={isMobile ? 18 : 20} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Tooltip
                    label={
                      listening
                        ? t("chat.tooltips.stopListening")
                        : t("chat.tooltips.startVoiceInput")
                    }
                  >
                    <ActionIcon
                      size={isMobile ? "sm" : "md"}
                      h={inputHeight}
                      w={inputHeight}
                      radius="lg"
                      variant={listening ? "filled" : "light"}
                      color={listening ? "red" : "blue"}
                      onClick={onMicClick}
                    >
                      {listening ? (
                        <Loader
                          type="dots"
                          size={isMobile ? 16 : 20}
                          color="white"
                        />
                      ) : (
                        <IconMicrophone size={isMobile ? 18 : 20} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                ))}
              <ActionIcon
                type="submit"
                size={isMobile ? "sm" : "md"}
                h={inputHeight}
                w={inputHeight}
                radius="lg"
                variant="filled"
                disabled={
                  (!form.values.message.trim() && !selectedFile) ||
                  isExtractingPdf ||
                  isParsingReddit ||
                  isStreaming
                }
              >
                {isParsingReddit ? (
                  <Loader type="dots" size={isMobile ? 16 : 20} color="white" />
                ) : (
                  <IconSend size={isMobile ? 18 : 20} />
                )}
              </ActionIcon>
            </Group>
          </Flex>
        </form>
      </Stack>
    </Box>
  );
}
