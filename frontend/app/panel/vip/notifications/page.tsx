"use client";

import { NotificationsList } from "@/components/notifcation/NotificationsList";

export default function VipNotificationsPage() {
  // تا زمان اصلاح تایپ NotificationsList، از as any استفاده می‌کنیم
  return <NotificationsList userRole={"vip" as any} />;
}
