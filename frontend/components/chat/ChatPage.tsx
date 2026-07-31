"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatList } from "./ChatList";
import { ChatWindow } from "./ChatWindow";
import { useMessages } from "@/hooks/useMessages";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatPage() {
  const {
    conversations,
    currentMessages,
    messagesLoading,
    loading,
    fetchMessages,
    reactions,
    sendMessage,
    socket,
    toggleReaction,
    typingUsers,
    editMessage,
    deleteMessage,
    uploadFile,
  } = useMessages();

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isClient, setIsClient] = useState(false);
  const prevConversationRef = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const params = new URLSearchParams(window.location.search);
    const id = params.get("conversationId") || null;
    setActiveConversationId(id);
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    if (!socket || !isClient) return;
    if (prevConversationRef.current) {
      socket.emit("leave-conversation", prevConversationRef.current);
    }
    if (activeConversationId) {
      socket.emit("join-conversation", activeConversationId);
    }
    prevConversationRef.current = activeConversationId;
    return () => {
      if (prevConversationRef.current) {
        socket.emit("leave-conversation", prevConversationRef.current);
      }
    };
  }, [activeConversationId, socket, isClient]);

  // مدیریت نمایش هوشمند منوی ناوبری پایین
  useEffect(() => {
    const bottomNav = document.getElementById("mobile-bottom-nav");
    if (bottomNav) {
      if (activeConversationId && window.innerWidth <= 768) {
        bottomNav.style.setProperty("display", "none", "important");
      } else {
        bottomNav.style.removeProperty("display");
      }
    }
    return () => {
      if (bottomNav) {
        bottomNav.style.removeProperty("display");
      }
    };
  }, [activeConversationId]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleUploadFile = useCallback(
    async (
      conversationId: string,
      file: File,
      text?: string,
      onProgress?: (p: number) => void,
    ) => {
      return uploadFile(conversationId, file, text, onProgress);
    },
    [uploadFile],
  );

  const handleDeleteConversation = (deletedId: string) => {
    if (activeConversationId === deletedId) {
      setActiveConversationId(null);
    }
  };

  return (
    <div
      className={cn(
        // تنظیم خطوط جداکننده خطی در بالا و پایین (border-t و border-b) و بهینه‌سازی ارتفاع تا مرز bottom-nav
        "flex w-full border-t border-b border-border/60 overflow-hidden bg-background md:rounded-2xl shadow-sm transition-all duration-200",
        activeConversationId
          ? "h-[100dvh] md:h-[calc(100vh-80px)]"
          : "h-[calc(100dvh-70px)] md:h-[calc(100vh-80px)]",
      )}
    >
      {/* بخش لیست گفتگوها */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-[380px] border-l border-border/60 flex-col h-full bg-card shrink-0",
          activeConversationId ? "hidden md:flex" : "flex",
        )}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 bg-background/50 backdrop-blur-md shrink-0"
          dir="rtl"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-xl hover:bg-muted shrink-0 h-9 w-9"
          >
            <ArrowRight className="w-5 h-5 text-foreground" />
          </Button>
          <h1 className="font-extrabold text-base text-foreground tracking-tight">
            گفتگوهای من
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ChatList
            conversations={conversations}
            loading={loading}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      </div>

      {/* بخش پنجره اصلی چت */}
      <div
        className={cn(
          "flex-1 flex-col min-w-0 bg-background relative h-full overflow-hidden",
          !activeConversationId ? "hidden md:flex" : "flex",
        )}
      >
        <ChatWindow
          conversationId={activeConversationId}
          conversations={conversations}
          currentMessages={currentMessages}
          messagesLoading={messagesLoading}
          onSendMessage={sendMessage}
          onUploadFile={handleUploadFile}
          onBack={() => setActiveConversationId(null)}
          onDeleteConversation={handleDeleteConversation}
          reactions={reactions}
          socket={socket}
          typingUsers={typingUsers}
          editMessage={editMessage}
          toggleReaction={toggleReaction}
          deleteMessage={deleteMessage}
        />
      </div>
    </div>
  );
}
