// frontend/app/hooks/useApiKeys.ts
import { useState, useEffect, useCallback } from "react";
import { developerApi } from "@/services/api/developer.api";
import { toast } from "sonner";

interface ApiKeyItem {
  _id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: string;
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt?: string;
  requestCount?: number;
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await developerApi.getApiKeys();
      // axios داده رو در res.data می‌فرسته — ساختار رو تطبیق میدیم
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.apiKeys || [];
      setKeys(
        data.map((k: any) => ({
          _id: k._id || k.id,
          name: k.name,
          keyPrefix: k.keyPrefix || k.prefix || "sk_••••",
          scopes: k.scopes || [],
          status: k.status || "active",
          expiresAt: k.expiresAt || null,
          createdAt: k.createdAt,
          lastUsedAt: k.lastUsedAt,
          requestCount: k.requestCount || 0,
        })),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "خطا در دریافت کلیدها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async (data: {
    name: string;
    scopes: string[];
    expiresInDays?: number;
  }) => {
    const res = await developerApi.createApiKey(data);
    await fetchKeys();
    return res.data;
  };

  const deleteKey = async (id: string) => {
    await developerApi.deleteApiKey(id);
    toast.success("کلید حذف شد");
    await fetchKeys();
  };

  const regenerateKey = async (id: string) => {
    const res = await developerApi.regenerateApiKey(id);
    toast.success("کلید بازسازی شد");
    await fetchKeys();
    return res.data;
  };

  return { keys, loading, fetchKeys, createKey, deleteKey, regenerateKey };
}
