"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserTicketsNew() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/support");
  }, [router]);
  return null;
}
