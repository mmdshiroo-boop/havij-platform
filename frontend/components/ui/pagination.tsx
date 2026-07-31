import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// 🔧 تعریف محلی ButtonProps (چون از button صادر نشده)
interface ButtonProps {
  size?: "default" | "icon" | "sm" | "lg";
}

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn(
      "mx-auto flex w-full justify-center animate-fade-in",
      className,
    )}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1.5", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "default" : "outline",
        size,
      }),
      "cursor-pointer font-bold rounded-xl h-9 w-9 text-xs transition-all duration-200",
      isActive
        ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 active:scale-90"
        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90",
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

// 🔧 استخراج size از props و استفاده از پیش‌فرض، بدون آنکه دوباره در spread بیاید
const PaginationPrevious = ({
  className,
  size, // ← حذف از props برای جلوگیری از تکرار
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn(
      "w-auto gap-1.5 px-3 border border-border text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95",
      className,
    )}
    {...props}
  >
    <ChevronRight className="h-4 w-4" />
    <span>قبلی</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  size, // ← حذف از props
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn(
      "w-auto gap-1.5 px-3 border border-border text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95",
      className,
    )}
    {...props}
  >
    <span>بعدی</span>
    <ChevronLeft className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn(
      "flex h-9 w-9 items-center justify-center text-muted-foreground/60",
      className,
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
