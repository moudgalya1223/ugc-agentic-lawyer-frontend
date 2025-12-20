import { createApiClient } from "react-query-ease";

export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
