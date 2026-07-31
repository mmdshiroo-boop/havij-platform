import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  // تبدیل xl به حداکثر ۱۲۸۰ پیکسل
  xl: "max-w-screen-xl",
  // تبدیل 2xl به ۱۴۴۰ پیکسل واقعی و بسیار شیک (محبوب‌ترین استاندارد وب)
  "2xl": "max-w-[1440px]",
  full: "max-w-full",
};

export function Container({
  children,
  className = "",
  maxWidth = "2xl", // پیش‌فرض روی ۱۴۴۰ پیکسل تنظیم شد
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto px-4 md:px-6 w-full", // کلاس کدرِ container حذف شد تا دستمان باز باشد
        maxWidthClasses[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}
