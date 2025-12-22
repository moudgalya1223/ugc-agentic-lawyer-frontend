import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Message } from "@/app/(protected)/chat/hooks/useChatLogic";
import { dayjs, getCurrentISOString } from "@/utils/dayjs.utils";

// Serialized version of Message for storage (timestamp is string)
type SerializedMessage = Omit<Message, "timestamp"> & {
  timestamp: string | Date;
};

// Chat as stored in the store (with serialized messages)
interface StoredChat {
  id: string;
  name: string;
  messages: SerializedMessage[];
  createdAt: string; // ISO string for serialization
  updatedAt: string; // ISO string for serialization
}

// Chat as returned from store (with deserialized messages)
export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string; // ISO string for serialization
  updatedAt: string; // ISO string for serialization
}

interface ChatStoreState {
  chats: Record<string, StoredChat>;
  addChat: (chatId: string, messages: Message[]) => void;
  updateChat: (chatId: string, messages: Message[]) => void;
  updateChatName: (chatId: string, name: string) => void;
  deleteChat: (chatId: string) => void;
  getChat: (chatId: string) => Chat | undefined;
  getAllChats: () => Chat[];
}

// Helper function to generate chat name from first user message
function generateChatName(messages: Message[]): string {
  const firstUserMessage = messages.find((msg) => msg.sender === "user");
  if (!firstUserMessage || !firstUserMessage.text.trim()) {
    return "New Chat";
  }
  const text = firstUserMessage.text.trim();
  if (text.length <= 50) {
    return text;
  }
  return `${text.slice(0, 47)}...`;
}

// Helper function to convert messages with Date objects to serializable format
// Preserves all fields including file, isDraft, and metadata
function serializeMessages(messages: Message[]): SerializedMessage[] {
  return messages.map((msg) => {
    const serialized: SerializedMessage = {
      ...msg,
      timestamp:
        msg.timestamp instanceof Date
          ? msg.timestamp.toISOString()
          : msg.timestamp,
    };

    // Preserve file info (blob URLs won't persist, but we keep the file name)
    if (msg.file) {
      serialized.file = {
        name: msg.file.name,
        url: msg.file.url, // Note: blob URLs won't work after page reload, but we preserve the structure
      };
    }

    // Preserve metadata if present (should be a plain object, but ensure it's serializable)
    if (msg.metadata) {
      serialized.metadata = msg.metadata;
    }

    // Preserve isDraft flag
    if (msg.isDraft !== undefined) {
      serialized.isDraft = msg.isDraft;
    }

    return serialized;
  });
}

// Helper function to deserialize messages (convert ISO strings back to Date objects)
// Restores all fields including file, isDraft, and metadata
function deserializeMessages(messages: SerializedMessage[]): Message[] {
  return messages.map((msg) => {
    const deserialized: Message = {
      ...msg,
      timestamp:
        typeof msg.timestamp === "string"
          ? new Date(msg.timestamp)
          : msg.timestamp instanceof Date
            ? msg.timestamp
            : new Date(),
    };

    // Restore file info
    if (msg.file) {
      deserialized.file = {
        name: msg.file.name,
        url: msg.file.url, // Note: blob URLs will be invalid after reload, but structure is preserved
      };
    }

    // Restore metadata
    if (msg.metadata) {
      deserialized.metadata = msg.metadata;
    }

    // Restore isDraft flag
    if (msg.isDraft !== undefined) {
      deserialized.isDraft = msg.isDraft;
    }

    return deserialized;
  });
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      chats: {},
      addChat: (chatId: string, messages: Message[]) => {
        const now = getCurrentISOString();
        const chatName = generateChatName(messages);
        const serializedMessages = serializeMessages(messages);

        set((state) => ({
          chats: {
            ...state.chats,
            [chatId]: {
              id: chatId,
              name: chatName,
              messages: serializedMessages,
              createdAt: now,
              updatedAt: now,
            },
          },
        }));
      },
      updateChat: (chatId: string, messages: Message[]) => {
        const now = getCurrentISOString();
        // Serialize all messages including user messages, bot responses, welcome message, and metadata
        const serializedMessages = serializeMessages(messages);

        set((state) => {
          const existingChat = state.chats[chatId];
          if (!existingChat) {
            // If chat doesn't exist, create it with all messages
            const chatName = generateChatName(messages);
            return {
              chats: {
                ...state.chats,
                [chatId]: {
                  id: chatId,
                  name: chatName,
                  messages: serializedMessages, // Includes all user and bot messages
                  createdAt: now,
                  updatedAt: now,
                },
              },
            };
          }

          // Check if messages have actually changed by comparing message count, IDs, and text
          // This prevents updating the timestamp when just viewing/loading a chat
          // Note: existingChat.messages are already serialized (stored format)
          const messagesChanged =
            existingChat.messages.length !== serializedMessages.length ||
            existingChat.messages.some((msg, index) => {
              const newMsg = serializedMessages[index];
              if (!newMsg) {
                return true;
              }
              // Compare key fields that indicate actual content changes
              // We compare serialized versions, so timestamps are already strings
              return (
                msg.id !== newMsg.id ||
                msg.text !== newMsg.text ||
                msg.sender !== newMsg.sender ||
                // Check if metadata changed (compare as JSON strings to handle object comparison)
                JSON.stringify(msg.metadata || null) !==
                  JSON.stringify(newMsg.metadata || null)
              );
            });

          // Only update timestamp if messages actually changed
          const shouldUpdateTimestamp = messagesChanged;

          // Update existing chat with complete message history
          // This preserves all user messages, bot responses, metadata, and file attachments
          const firstUserMessage = messages.find(
            (msg) => msg.sender === "user"
          );
          const shouldUpdateName =
            existingChat.name === "New Chat" &&
            firstUserMessage &&
            firstUserMessage.text.trim();

          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...existingChat,
                messages: serializedMessages, // Complete message array with all responses
                updatedAt: shouldUpdateTimestamp ? now : existingChat.updatedAt, // Only update if messages changed
                name: shouldUpdateName
                  ? generateChatName(messages)
                  : existingChat.name,
              },
            },
          };
        });
      },
      updateChatName: (chatId: string, name: string) => {
        set((state) => {
          const existingChat = state.chats[chatId];
          if (!existingChat) {
            return state;
          }
          return {
            chats: {
              ...state.chats,
              [chatId]: {
                ...existingChat,
                name: name.trim() || "New Chat",
                updatedAt: getCurrentISOString(),
              },
            },
          };
        });
      },
      deleteChat: (chatId: string) => {
        set((state) => {
          const { [chatId]: _, ...remainingChats } = state.chats;
          return {
            chats: remainingChats,
          };
        });
      },
      getChat: (chatId: string) => {
        const chat = get().chats[chatId];
        if (!chat) {
          return undefined;
        }
        // Deserialize messages when retrieving
        return {
          ...chat,
          messages: deserializeMessages(chat.messages),
        };
      },
      getAllChats: () => {
        const chats = Object.values(get().chats);
        // Sort by createdAt (most recent first) and deserialize messages
        return chats
          .sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          )
          .map((chat) => ({
            ...chat,
            messages: deserializeMessages(chat.messages),
          }));
      },
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
