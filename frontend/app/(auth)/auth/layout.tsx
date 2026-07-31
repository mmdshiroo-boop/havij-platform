import { Suspense } from "react"; // ✅ اضافه شد
import { Header } from "@/components/common/header";
import { Toaster } from "sonner";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      {/* ✅ Header را داخل Suspense قرار دهید */}
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
        {children}
        <Toaster position="top-center" richColors />
      </div>
    </div>
  );
}
