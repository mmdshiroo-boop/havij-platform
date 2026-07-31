// frontend/app/panel/developer/api-key/hooks/useApiKeys.ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiKeyService, ApiKey } from "@/services/api/api-key.api";

export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  expiresInDays?: number;
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiKeyService.getApiKeys();
      setKeys(data);
    } catch (err: any) {
      setError(err.message || "خطا در دریافت کلیدها");
      toast.error("خطا در دریافت کلیدهای API");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fix: پارامتر به صورت آبجکت
  const createKey = async (input: CreateApiKeyInput) => {
    try {
      const result = await apiKeyService.createApiKey(input);
      await fetchKeys();
      toast.success("کلید API با موفقیت ایجاد شد");
      return result;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "خطا در ایجاد کلید");
      throw err;
    }
  };

  const updateKey = async (id: string, data: Partial<ApiKey>) => {
    try {
      await apiKeyService.updateApiKey(id, data);
      await fetchKeys();
      toast.success("کلید با موفقیت بروزرسانی شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "خطا در بروزرسانی");
      throw err;
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await apiKeyService.deleteApiKey(id);
      await fetchKeys();
      toast.success("کلید با موفقیت حذف شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "خطا در حذف کلید");
      throw err;
    }
  };

  const regenerateKey = async (id: string) => {
    try {
      const result = await apiKeyService.regenerateApiKey(id);
      await fetchKeys();
      toast.success("کلید با موفقیت بازسازی شد");
      return result;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "خطا در بازسازی کلید");
      throw err;
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  return {
    keys,
    loading,
    error,
    fetchKeys,
    createKey,
    updateKey,
    deleteKey,
    regenerateKey,
  };
}
