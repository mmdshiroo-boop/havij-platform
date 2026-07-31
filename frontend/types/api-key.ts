// frontend/types/api-key.ts
export interface ApiKey {
  id: string;
  name: string;
  key: string; // فقط در زمان ایجاد نمایش داده میشه
  scopes: string[]; // دسترسی‌ها: ['read', 'write', 'delete', 'admin']
  status: "active" | "inactive" | "expired";
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  requestCount: number;
}

export interface CreateApiKeyDto {
  name: string;
  scopes: string[];
  expiresInDays?: number; // 30, 60, 90, never
}

export interface ApiKeyStats {
  totalRequests: number;
  last24hRequests: number;
  successRate: number;
}
