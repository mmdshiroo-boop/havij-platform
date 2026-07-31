// frontend/app/(main)/panel/agent/notifications/page.tsx

"use client";

import { NotificationsList } from "@/components/notifcation/NotificationsList";


export default function AgentNotificationsPage() {
  return <NotificationsList userRole="agent" />;
}
