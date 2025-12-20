"use client";

import {
  Anchor,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const form = useForm<LoginFormValues>({
    validateInputOnChange: true,
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : t("login.invalidEmail"),
      password: (value) =>
        value.length < 6 ? t("login.passwordTooShort") : null,
    },
  });

  const handleLogin = (values: LoginFormValues) => {
    // TODO: Implement actual login API call with values.email and values.password
    console.log("Login attempt:", {
      email: values.email,
      rememberMe: values.rememberMe,
    });

    showNotification({
      title: t("login.loginSuccessful"),
      message: t("login.loginSuccessfulMessage"),
      color: "green",
    });

    router.push("/home");
  };

  return (
    <Container size="md" my={40}>
      <Button
        component={Link}
        href="/"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="lg"
      >
        {t("common.backToHome")}
      </Button>
      <Title ta="center" order={2} fw={500}>
        {t("login.title")}
      </Title>

      <Text ta="center" c="dimmed">
        {t("login.noAccount")} <Anchor>{t("login.createAccount")}</Anchor>
      </Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleLogin)}>
          <TextInput
            label={t("login.email")}
            placeholder={t("login.emailPlaceholder")}
            required
            radius="md"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label={t("login.password")}
            placeholder={t("login.passwordPlaceholder")}
            required
            mt="md"
            radius="md"
            {...form.getInputProps("password")}
          />
          <Group justify="space-between" mt="lg">
            <Checkbox
              label={t("login.rememberMe")}
              {...form.getInputProps("rememberMe", {
                type: "checkbox",
              })}
            />
            <Anchor component="button" size="sm" type="button">
              {t("login.forgotPassword")}
            </Anchor>
          </Group>
          <Button fullWidth mt="xl" radius="md" type="submit">
            {t("login.signIn")}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default LoginPage;
