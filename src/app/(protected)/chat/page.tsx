"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Chat = () => {
  const router = useRouter();

  useEffect(() => {
    // Generate a unique chat ID and redirect
    const chatId = crypto.randomUUID();
    router.replace(`/chat/${chatId}`);
  }, []);

  return null;
};

export default Chat;
