"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useChatStore } from "@/store";

const Chat = () => {
  const router = useRouter();
  const { addChat } = useChatStore();

  useEffect(() => {
    // Generate a unique chat ID and redirect
    const chatId = crypto.randomUUID();
    // Initialize chat in store with empty messages
    // The chat page will handle adding the welcome message
    addChat(chatId, []);
    router.replace(`/chat/${chatId}`);
  }, []);

  return null;
};

export default Chat;
