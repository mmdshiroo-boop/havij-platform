export interface CookieAudit {
  _id: string;
  userId: {
    _id: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  sessionId: string;
  type: "login" | "logout" | "token_refresh" | "session_check" | "suspicious";
  ip: string;
  userAgent: string;
  fingerprint: string;
  cookieName: string;
  status: "success" | "failed" | "expired" | "revoked";
  metadata?: {
    reason?: string;
  };
  createdAt: string;
}

export interface CookieAuditStats {
  totalLogins: number;
  suspiciousLast24h: number;
  activeSessionCount: number;
  uniqueIPs: number;
  recentSuspicious: {
    _id: string;
    ip: string;
    reason?: string;
    user: string;
    createdAt: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
