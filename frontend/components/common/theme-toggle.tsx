"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        className="h-9 w-9 rounded-xl text-primary bg-muted/20 flex items-center justify-center"
        size="icon"
        disabled
      >
        <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative h-9 w-9 rounded-xl bg-card hover:bg-muted text-foreground transition-all duration-500 ease-in-out hover:opacity-85 active:scale-95 shadow-xs flex items-center justify-center"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "حالت روز" : "حالت شب"}
    >
      {/* آیکون خورشید - در حالت عادی لایت ظاهر است و در دارک غیب و چرخیده می‌شود */}
      <Sun className="h-[18px] w-[18px] text-primary transition-all duration-700 ease-in-out rotate-0 scale-100 dark:-rotate-180 dark:scale-0" />

      {/* آیکون ماه - در حالت عادی مخفی و چرخیده است و در دارک ظاهر می‌شود */}
      <Moon className="absolute h-[18px] w-[18px] text-primary transition-all duration-700 ease-in-out rotate-180 scale-0 dark:rotate-0 dark:scale-100" />

      <span className="sr-only">تغییر پوسته</span>
    </Button>
  );
}
