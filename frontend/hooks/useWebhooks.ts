import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { webhookService, Webhook } from "@/services/api/webhook.api";

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await webhookService.getWebhooks();
      setWebhooks(data);
    } catch (error: any) {
      toast.error("خطا در دریافت Webhookها");
    } finally {
      setLoading(false);
    }
  }, []);

  const createWebhook = async (name: string, url: string, events: string[]) => {
    try {
      const result = await webhookService.createWebhook({ name, url, events });
      await fetchWebhooks();
      return result;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ایجاد Webhook");
      throw error;
    }
  };

  const updateWebhook = async (id: string, data: Partial<Webhook>) => {
    try {
      await webhookService.updateWebhook(id, data);
      await fetchWebhooks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در بروزرسانی");
      throw error;
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      await webhookService.deleteWebhook(id);
      await fetchWebhooks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در حذف Webhook");
      throw error;
    }
  };

  const regenerateSecret = async (id: string) => {
    try {
      const result = await webhookService.regenerateSecret(id);
      await fetchWebhooks();
      return result;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در بازسازی Secret");
      throw error;
    }
  };

  const testWebhook = async (id: string) => {
    try {
      const result = await webhookService.testWebhook(id);
      return result;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ارسال تست وب‌هوک");
      throw error;
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    loading,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    regenerateSecret,
    testWebhook,
  };
}
