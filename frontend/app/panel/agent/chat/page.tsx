// app/chat/page.tsx
"use client";

import { ChatPage } from "@/components/chat/ChatPage";

export default function GlobalChatPage() {
  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4 h-full">
        <ChatPage />
      </div>
    </div>
  );
}
