// app/panel/admin/comments/page.tsx
"use client";

import CommentsManager from "@/components/panel/CommentsManager";

export default function AdminCommentsPage() {
  return <CommentsManager isAdmin={true} />;
}