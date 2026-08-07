// frontend/types/index.ts

export interface User {
  _id: string;
  id?: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  avatar?: string;
  agencyName?: string;
  nationalCode?: string;
  province?: string;
  city?: string;
  district?: string;
  createdAt?: string;
  phoneVerified?: boolean;
  nationalCodeVerified?: boolean;
}

export interface Amenities {
  parking?: boolean;
  storage?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  gym?: boolean;
  pool?: boolean;
  sauna?: boolean;
}

export interface AdditionalProperty {
  name: string;
  value: string;
}

export interface Ad {
  _id: string;
  title: string;
  isVip?: boolean;
  slug?: string;
  description?: string;
  price: number;
  priceType?: "fixed" | "negotiable" | "auction";
  priceString?: string;
  category?: { _id: string; name: string; slug: string };
  categoryName?: string;
  categoryId?: string;
  city: string;
  district?: string;
  province?: string;
  fullAddress?: string;
  address?: string;
  images?: string[];
  image?: string;
  contactPhone?: string;
  contactName?: string;
  views?: number;
  status?: "pending" | "active" | "sold" | "expired" | "rejected";
  isUrgent?: boolean;
  isVerified?: boolean;
  adType?: "sale" | "rent" | "daily_rent" | "exchange" | "mortgage";
  userId?: string;
  user?: { _id: string; firstName?: string; lastName?: string };
  createdAt?: string;
  updatedAt?: string;
  sourceUrl?: string;
  area?: number;
  buildingArea?: number;
  landLength?: number;
  landWidth?: number;
  rooms?: number;
  documentType?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  sellerName?: string;
  agencyName?: string;
  parkingCount?: number;
  floorCount?: number;
  unitsPerFloor?: number;
  buildingAge?: number;
  occupancyStatus?: "empty" | "occupied" | "tenant";
  buildingOrientation?: string;
  unitOrientation?: string;
  buildingFacade?: string;
  kitchenFeatures?: string[];
  securityFeatures?: string[];
  amenities?: Amenities;
  additionalProperties?: AdditionalProperty[];
}

export interface CreateAdData {
  title: string;
  description: string;
  price: number;
  priceType: "fixed" | "negotiable" | "auction";
  adType: "sale" | "rent" | "daily_rent" | "exchange" | "mortgage";
  categoryId: string;
  city: string;
  district?: string;
  address?: string;
  images: string[];
  contactPhone: string;
  contactName?: string;
  isUrgent?: boolean;
  area?: number;
  rooms?: number;
  buildingAge?: number;
  yearBuilt?: number;
  parkingCount?: number;
  latitude?: number;
  longitude?: number;
  amenities?: Amenities;
  additionalProperties?: AdditionalProperty[];
    province?: string;     
}

export interface Ticket {
  _id: string;
  title?: string;
  subject?: string;
  status: string;
  priority?: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
  rating?: number;
  messages?: {
    _id?: string;
    sender: string;
    message: string;
    timestamp: string;
  }[];
  userId?: string;
}

export interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  metadata?: any;
}

export interface Province {
  _id: string;
  name: string;
  slug?: string;
}

export interface City {
  _id: string;
  name: string;
  slug?: string;
}

export interface District {
  _id: string;
  name: string;
  lat?: number;
  lng?: number;
}

export interface VipPlan {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  discount: number;
  isPopular: boolean;
}

export interface VipStats {
  totalAds: number;
  activeAds: number;
  expiredAds: number;
  views: number;
  subscriptionEndDate?: string | null;
  clicks: number;
  isVip?: boolean;
  vipAdsCount?: number;
  vipAdViews?: number;
  weeklyGrowth?: number;
  savedAds?: number;
  savedIncrease?: number;
  rank?: number;
}

export interface CurrentPlan {
  planId: string;
  name: string;
  price: number;
  adLimit: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  isActive?: boolean;
  expiresAt?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  status: "active" | "inactive" | "expired";
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  requestCount: number;
}

export interface ApiKeyStats {
  totalRequests: number;
  last24hRequests: number;
  successRate: number;
}

// ══════════════ بخش کوکی ══════════════
export interface CookieAudit {
  _id: string;
  userId: {
    _id: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    email?: string;   // ✅ اضافه شد
    role?: string;
  } | null;           // null برای کاربر ناشناس
  sessionId: string;
  type:
    | "login"
    | "logout"
    | "token_refresh"
    | "session_check"
    | "suspicious"
    | "page_view"
    | "session_create"
    | "session_destroy"
    | "cookie_set"
    | "cookie_read"
    | "cookie_delete";
  ip: string;
  userAgent: string;
  fingerprint: string;
  cookieName: string;
  status:
    | "success"
    | "failed"
    | "expired"
    | "revoked"
    | "suspicious"
    | "active"
    | "blocked";
  metadata?: Record<string, any>;
  createdAt: string;
  tokenId?: string;
  location?: string | { city?: string; country?: string };
  device?: string;
}

// types/index.ts (بخشی از کد)
export interface CookieAuditLog {
  _id: string;
  type: string;
  status: string;
  userId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    role?: string;
    avatar?: string;                 
  } | null;
  ip?: string;
  userAgent?: string;
  device?: string;
  sessionId?: string;
  tokenId?: string;
  cookieData?: any;                 
  cookieName?: string;
  navigation?: {
    currentPath?: string;
  };
  location?: string | { city?: string; country?: string };
  metadata?: Record<string, any>;
  expiresAt?: string;
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

export interface MapAdItem {
  _id: string;
  title: string;
  price: number;
  city: string;
  district?: string;
  images?: string[];
  image?: string;
  lat?: number;
  lng?: number;
  area?: number;
  rooms?: number;
  adType?: string;
}