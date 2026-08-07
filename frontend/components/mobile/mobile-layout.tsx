"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MobileHeader } from "./mobile-header";
import { BottomNav } from "./bottom-nav";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
  headerAction?: React.ReactNode;
}

export function MobileLayout({
  children,
  title,
  showBack = false,
  showNav = true,
  headerAction,
}: MobileLayoutProps) {
  const pathname = usePathname();

  const isInsideActiveChat =
    pathname?.startsWith("/chat/") && pathname.split("/").length > 2;

  const shouldRenderNav = showNav && !isInsideActiveChat;

  return (
    <div className="flex justify-center min-h-screen bg-slate-100 dark:bg-zinc-950">
      <div className="relative flex flex-col w-full max-w-md min-h-screen bg-white dark:bg-zinc-900 shadow-xl border-x border-slate-200/50 dark:border-zinc-800">
        {title && (
          <MobileHeader
            {...({ title, showBack, action: headerAction } as any)}
          />
        )}

        <main
          className={cn(
            "flex-1 flex flex-col",
            isInsideActiveChat
              ? "overflow-hidden p-0 pt-0"
              : `overflow-y-auto px-4 pb-24 ${title ? "pt-16" : "pt-4"}`,
          )}
        >
          {children}
        </main>

        {shouldRenderNav && <BottomNav />}
      </div>
    </div>
  );
}