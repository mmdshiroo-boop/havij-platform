// app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppProviders } from "@/components/providers/app-provider";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SettingsProvider } from "./context/SettingsContext";
import PageViewLogger from "@/components/ui/PageViewLogger";
import { Toaster } from "sonner";

export const dynamic = 'force-dynamic'; 

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "پلتفرم آگهی هویج",
    description: "بزرگ‌ترین بازار کالا و خدمات",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
      </head>
      <body className="font-vazirmatn antialiased min-h-screen bg-background text-foreground">
        <AppProviders>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SettingsProvider>
              <Suspense fallback={null}>
                <PageViewLogger />
              </Suspense>
              {children}
            </SettingsProvider>
          </ThemeProvider>
        </AppProviders>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}