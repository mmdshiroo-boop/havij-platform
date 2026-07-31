// backend/src/config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Divar Clone API Documentation",
      version: "1.0.0",
      description: "مستندات کامل API سامانه آگهی‌های آنلاین",
      contact: {
        name: "Developer Team",
        email: "dev@divar-clone.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5001/api",
        description: "Development Server",
      },
      {
        url: "https://api.divar-clone.com/api",
        description: "Production Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "توکن JWT برای احراز هویت",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "کلید API برای دسترسی به endpoints",
        },
      },
      schemas: {
        // ==================== User Schemas ====================
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "507f1f77bcf86cd799439011" },
            firstName: { type: "string", example: "علی" },
            lastName: { type: "string", example: "رضایی" },
            phone: { type: "string", example: "09123456789" },
            email: { type: "string", example: "ali@example.com" },
            role: {
              type: "string",
              enum: [
                "user",
                "vip",
                "agent",
                "expert",
                "admin",
                "super_admin",
                "developer",
              ],
            },
            avatar: { type: "string", example: "/uploads/avatars/avatar.jpg" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ==================== Ad Schemas ====================
        Ad: {
          type: "object",
          properties: {
            id: { type: "string", example: "507f1f77bcf86cd799439011" },
            title: { type: "string", example: "آپارتمان ۸۰ متری در تهرانپارس" },
            description: {
              type: "string",
              example: "آپارتمان نوساز با امکانات کامل...",
            },
            price: { type: "number", example: 2500000000 },
            category: { type: "string", example: "ملک" },
            location: {
              type: "object",
              properties: {
                lat: { type: "number", example: 35.6892 },
                lng: { type: "number", example: 51.389 },
                address: {
                  type: "string",
                  example: "تهران، تهرانپارس، خیابان ...",
                },
              },
            },
            images: {
              type: "array",
              items: { type: "string" },
              example: ["/uploads/ads/image1.jpg"],
            },
            status: {
              type: "string",
              enum: ["pending", "active", "rejected", "expired"],
            },
            userId: { type: "string" },
            views: { type: "number", example: 150 },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ==================== API Key Schemas ====================
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "سرویس موبایل" },
            keyPrefix: { type: "string", example: "divar_dev" },
            scopes: {
              type: "array",
              items: { type: "string" },
              example: ["read", "write"],
            },
            status: { type: "string", enum: ["active", "inactive", "expired"] },
            requestCount: { type: "number", example: 15234 },
            lastUsedAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ==================== Webhook Schemas ====================
        Webhook: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "ارسال به سرور من" },
            url: { type: "string", example: "https://my-server.com/webhook" },
            events: {
              type: "array",
              items: { type: "string" },
              example: ["ad.created", "ad.updated"],
            },
            status: { type: "string", enum: ["active", "inactive", "failed"] },
            deliveryCount: { type: "number", example: 1250 },
            successCount: { type: "number", example: 1240 },
            failureCount: { type: "number", example: 10 },
            lastTriggeredAt: { type: "string", format: "date-time" },
            lastError: { type: "string" },
          },
        },

        // ==================== Common Schemas ====================
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "خطا در دریافت اطلاعات" },
          },
        },
        Success: {
          type: "object",
          properties: {
            message: { type: "string", example: "عملیات با موفقیت انجام شد" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: "Auth", description: "احراز هویت و ثبت‌نام" },
      { name: "Users", description: "مدیریت کاربران" },
      { name: "Ads", description: "مدیریت آگهی‌ها" },
      { name: "Categories", description: "دسته‌بندی‌ها" },
      { name: "Locations", description: "موقعیت مکانی" },
      { name: "Favorites", description: "علاقه‌مندی‌ها" },
      { name: "Notifications", description: "اعلان‌ها" },
      { name: "Properties", description: "املاک" },
      { name: "Reports", description: "گزارشات" },
      { name: "Admin", description: "مدیریت سیستم (ادمین)" },
      { name: "Super Admin", description: "مدیریت کامل (سوپرادمین)" },
      { name: "Expert", description: "کارشناسان" },
      { name: "Developer", description: "توسعه‌دهندگان" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // مسیر فایل‌های حاوی مستندات
};

export const specs = swaggerJsdoc(options);
