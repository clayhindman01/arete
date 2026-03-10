export type AIMessage = {
  id: string;
  user_id: string;
  created_at: string;
  role: "user" | "assistant";
  content: string;
};
