import { createApiClient } from "react-query-ease";

export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // headers: {
  //   "x-cg-demo-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
  // },
});
