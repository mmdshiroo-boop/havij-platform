// app/panel/developer/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Code2 } from "lucide-react";

export default function DeveloperPanelIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/panel/developer/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Code2 className="h-5 w-5 text-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}
