// components/ad/AdTabs.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdTabsProps {
  tabs: {
    id: string;
    label: string;
  }[];
}

export function AdTabs({ tabs }: AdTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div
      className="w-full border-b border-border/60 sticky top-[64px] bg-background/80 backdrop-blur-md z-30 overflow-x-auto scrollbar-none"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-6 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "py-3.5 text-xs md:text-sm font-bold transition-all relative border-b-2 border-transparent text-muted-foreground whitespace-nowrap active:scale-95",
                isActive && "text-primary border-primary font-black",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
