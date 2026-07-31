import { Request, Response, NextFunction } from "express";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import Payment, {
  IPayment,
  formatAmountPersian,
} from "../../../models/payment.model";

// ==================== تنظیمات محیطی ====================

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const DEFAULT_GATEWAY =
  (process.env.PAYMENT_GATEWAY as "zarinpal" | "idpay" | "payir") || "zarinpal";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REQUEST_TIMEOUT = 30_000; // ۳۰ ثانیه

// کلیدهای درگاه‌ها
const ZARINPAL_MERCHANT_ID =
  process.env.ZARINPAL_MERCHANT_ID || "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
const ZARINPAL_SANDBOX = process.env.ZARINPAL_SANDBOX === "true";

const IDPAY_API_KEY = process.env.IDPAY_API_KEY || "";
const IDPAY_SANDBOX = process.env.IDPAY_SANDBOX === "true";

const PAYIR_API_KEY = process.env.PAYIR_API_KEY || "";

// ==================== تایپ‌ها ====================

/** نتیجه‌ی ایجاد پرداخت در هر درگاه */
interface GatewayPaymentResult {
  paymentUrl: string;
  transactionId: string;
}

/** نتیجه‌ی تایید پرداخت در هر درگاه */
interface GatewayVerifyResult {
  success: boolean;
  refNumber: string;
  cardPan: string;
  amount?: number;
  message?: string;
}

/** پارامترهای ایجاد پرداخت */
interface CreatePaymentBody {
  amount: number;
  description: string;
  orderId?: string;
  callbackUrl?: string;
  gateway?: "zarinpal" | "idpay" | "payir";
  metadata?: any;
}

// ==================== پیام‌های فارسی خطا ====================

const ERROR_MESSAGES: Record<number, string> = {
  // خطاهای عمومی
  400: "درخواست نامعتبر است. لطفاً اطلاعات را بررسی کنید.",
  401: "خطای احراز هویت. کلید API معتبر نیست.",
  403: "دسترسی غیرمجاز.",
  404: "تراکنش مورد نظر یافت نشد.",
  408: "زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.",
  500: "خطای داخلی سرور درگاه پرداخت. لطفاً بعداً تلاش کنید.",
  502: "خطا در اتصال به درگاه پرداخت.",
  503: "درگاه پرداخت در حال حاضر در دسترس نیست.",
  504: "پاسخ درگاه پرداخت بسیار طولانی شد.",
  // خطاهای زرین‌پال
  [-11]: "درخواست ارسال نشد.",
  [-12]: "شارژ حساب کافی نیست.",
  [-13]: "نقش کاربر نامعتبر است.",
  [-14]: "شناسه مرchant نامعتبر است.",
  [-15]: "تراکنش قبلاً تایید شده است.",
  [-16]: "تراکنش قبلاً ثبت شده و در حال بررسی است.",
  [-21]: "هیچ عملیات مالی برای این تراکنش یافت نشد.",
  [-22]: "تراکنش ناموفق بود.",
  [-23]: "پارامترهای ورودی نامعتبر هستند.",
  [-24]: "مبلغ باید عدد صحیح باشد.",
  [-25]: "مبلغ تراکنش از سقف مجاز بیشتر است.",
  [-31]: "حساب کاربری فروشنده فعال نیست.",
  [-32]: "حساب کاربری فروشنده معلق شده است.",
  [-33]: "حساب کاربری فروشنده مسدود شده است.",
  [-34]:
    "نقش حساب کاربری فروشنده به فروشنده ارتقا یافته و در انتظار تایید است.",
  [-35]: "حساب کاربری فروشنده هنوز توسط سیستم تایید نشده است.",
  [-40]: "سطح تایید فروشگاه کافی نیست.",
  [-41]: "درگاه پرداخت فعال نیست.",
  [-42]: "نام فروشگاه تایید نشده است.",
  [-54]: "درخواست منقضی شده است. لطفاً دوباره تلاش کنید.",
  // خطاهای آیدی‌پی
  1: "تراکنش با موفقیت انجام شده است.",
  2: "تراکنش در حال بررسی است.",
  3: "تراکنش با موفقیت تایید شد.",
  4: "تراکنش با موفقیت تایید و واریز شد.",
  10: "تراکنش قبلاً تایید شده است.",
  11: "تراکنش قبلاً لغو شده است.",
  12: "تراکنش منقضی شده است.",
  13: "درخواست شما نامعتبر است.",
  14: "کلید API نامعتبر است.",
  15: "تراکنش متعلق به شما نیست.",
  16: "تراکنش متعلق به این کلید API نیست.",
  17: "مبلغ تراکنش با مبلغ ثبت‌شده یکسان نیست.",
  21: "پرداخت توسط کاربر لغو شد.",
  22: "پرداخت ناموفق بود.",
  23: "پرداخت با خطا مواجه شد.",
  30: "درخواست نامعتبر است.",
  31: "کلید API نامعتبر است.",
  40: "پارامترهای ورودی نامعتبر هستند.",
  41: "مبلغ تراکنش از سقف مجاز بیشتر است.",
  42: "درگاه پرداخت فعال نیست.",
  43: "حساب کاربری فروشنده فعال نیست.",
  // خطاهای پی‌آی‌آر
  [-1]: "ارسال اطلاعات ناقص است.",
  [-2]: "مرچنت کد نامعتبر است.",
  [-3]: "با توجه به محدودیت‌های شتاب شبکه، امکان پرداخت با رقم درخواست شده وجود ندارد.",
  [-4]: "سطح تایید فروشنده پایین‌تر از سطح نقره‌ای است.",
  [-5]: "آدرس بازگشت نامعتبر است.",
  [-6]: "تراکنش قبلاً انجام شده است.",
  [-7]: "تراکنش توسط کاربر لغو شده است.",
  [-8]: "درگاه پرداخت غیرفعال شده است.",
  [-9]: "خطای سیستم.",
  [-98]: "تراکنش قبلاً تایید شده است.",
  [-99]: "خطای احراز هویت.",
};

/**
 * دریافت پیام خطای فارسی بر اساس کد خطا
 */
function getPersianError(code: number, fallback?: string): string {
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (fallback) return fallback;
  return `خطای ناشناخته (کد: ${code})`;
}

// ==================== ابزارهای کمکی ====================

/**
 * تولید شناسه تراکنش یکتا
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `txn_${timestamp}_${random}`;
}

/**
 * استخراج آی‌پی کاربر از درخواست
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "0.0.0.0";
}

/**
 * پیکربندی مشترک axios برای تمام درخواست‌ها به درگاه‌ها
 */
const axiosConfig: AxiosRequestConfig = {
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// ==================== پیاده‌سازی درگاه زرین‌پال ====================

const zarinpalGateway = {
  baseUrl: "https://api.zarinpal.com/pg/v4/payment",
  sandboxUrl: "https://sandbox.zarinpal.com/pg/v4/payment",
  paymentPage: "https://www.zarinpal.com/pg/StartPay/",
  sandboxPaymentPage: "https://sandbox.zarinpal.com/pg/StartPay/",

  /** دریافت آدرس پایه بر اساس محیط */
  getBaseUrl(): string {
    return ZARINPAL_SANDBOX ? this.sandboxUrl : this.baseUrl;
  },

  /** دریافت آدرس صفحه پرداخت */
  getPaymentPageUrl(authority: string): string {
    const base = ZARINPAL_SANDBOX ? this.sandboxPaymentPage : this.paymentPage;
    return `${base}${authority}`;
  },

  /** ایجاد پرداخت در زرین‌پال */
  async createPayment(
    amount: number,
    description: string,
    callbackUrl: string,
    orderId?: string,
  ): Promise<GatewayPaymentResult> {
    const url = `${this.getBaseUrl()}/request.json`;
    const payload = {
      merchant_id: ZARINPAL_MERCHANT_ID,
      amount, // زرین‌پال ریال یا تومان قبول می‌کند - ما ریال می‌فرستیم
      description,
      callback_url: callbackUrl,
      metadata: {
        order_id: orderId || generateTransactionId(),
      },
    };

    try {
      const response = await axios.post(url, payload, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          Authorization: `Bearer ${ZARINPAL_MERCHANT_ID}`,
        },
      });

      const { data } = response.data;

      if (data.code === 100) {
        // موفقیت - کد ۱۰۰ به معنای ایجاد موفق تراکنش است
        return {
          paymentUrl: this.getPaymentPageUrl(data.authority),
          transactionId: data.authority,
        };
      }

      // خطا از سمت زرین‌پال
      throw new Error(
        getPersianError(data.code, `خطای زرین‌پال: کد ${data.code}`),
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("خطای زرین‌پال")) {
        throw error;
      }
      const axiosErr = error as AxiosError;
      throw new Error(
        `خطا در اتصال به زرین‌پال: ${axiosErr.response ? JSON.stringify(axiosErr.response.data) : axiosErr.message}`,
      );
    }
  },

  /** تایید پرداخت در زرین‌پال */
  async verifyPayment(
    authority: string,
    amount: number,
  ): Promise<GatewayVerifyResult> {
    const url = `${this.getBaseUrl()}/verify.json`;
    const payload = {
      merchant_id: ZARINPAL_MERCHANT_ID,
      amount,
      authority,
    };

    try {
      const response = await axios.post(url, payload, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          Authorization: `Bearer ${ZARINPAL_MERCHANT_ID}`,
        },
      });

      const { data } = response.data;

      if (data.code === 100) {
        // پرداخت تایید شد
        return {
          success: true,
          refNumber: data.ref_id?.toString() || "",
          cardPan: data.card_pan || "",
          amount: data.amount,
        };
      }

      // کدهای خطای زرین‌پال
      if (data.code === 101) {
        // تراکنش قبلاً تایید شده - Idempotency
        return {
          success: true,
          refNumber: data.ref_id?.toString() || "",
          cardPan: data.card_pan || "",
          amount: data.amount,
          message: "تراکنش قبلاً تایید شده است.",
        };
      }

      // شکست
      return {
        success: false,
        refNumber: "",
        cardPan: "",
        message: getPersianError(data.code, `خطای زرین‌پال: کد ${data.code}`),
      };
    } catch (error) {
      const axiosErr = error as AxiosError;
      throw new Error(
        `خطا در تایید پرداخت زرین‌پال: ${axiosErr.response ? JSON.stringify(axiosErr.response.data) : axiosErr.message}`,
      );
    }
  },
};

// ==================== پیاده‌سازی درگاه آیدی‌پی ====================

const idpayGateway = {
  baseUrl: "https://api.idpay.ir/v1.1",
  paymentPage: "https://idpay.ir/p/",

  /** ایجاد پرداخت در آیدی‌پی */
  async createPayment(
    amount: number,
    description: string,
    callbackUrl: string,
    orderId?: string,
  ): Promise<GatewayPaymentResult> {
    const url = `${this.baseUrl}/payment`;
    const payload: Record<string, any> = {
      amount, // آیدی‌پی ریال دریافت می‌کند
      desc: description,
      callback: callbackUrl,
      order_id: orderId || generateTransactionId(),
    };

    try {
      const response = await axios.post(url, payload, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          "X-API-Key": IDPAY_API_KEY,
          "X-SANDBOX": IDPAY_SANDBOX ? "1" : "0",
        },
      });

      const { data } = response;

      if (data.status === 200 || data.status === 201) {
        return {
          paymentUrl: `${this.paymentPage}${data.id}`,
          transactionId: data.id,
        };
      }

      throw new Error(
        getPersianError(
          data.error_code || data.status,
          `خطای آیدی‌پی: کد ${data.error_code}`,
        ),
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("خطای آیدی‌پی")) {
        throw error;
      }
      const axiosErr = error as AxiosError;
      throw new Error(
        `خطا در اتصال به آیدی‌پی: ${axiosErr.response ? JSON.stringify(axiosErr.response.data) : axiosErr.message}`,
      );
    }
  },

  /** تایید پرداخت در آیدی‌پی */
  async verifyPayment(
    transactionId: string,
    amount: number,
  ): Promise<GatewayVerifyResult> {
    const url = `${this.baseUrl}/payment/verify`;
    const payload = {
      id: transactionId,
      order_id: "", // آیدی‌پی order_id هم نیاز دارد ولی ما با id تایید می‌کنیم
    };

    try {
      const response = await axios.post(url, payload, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          "X-API-Key": IDPAY_API_KEY,
          "X-SANDBOX": IDPAY_SANDBOX ? "1" : "0",
        },
      });

      const { data } = response;

      if (data.status === 200) {
        // پرداخت موفق
        return {
          success: true,
          refNumber: data.transaction_id?.toString() || "",
          cardPan: data.payment?.card_no || "",
          amount: data.amount,
        };
      }

      if (data.status === 201) {
        // تراکنش قبلاً تایید شده - Idempotency
        return {
          success: true,
          refNumber: data.transaction_id?.toString() || "",
          cardPan: data.payment?.card_no || "",
          amount: data.amount,
          message: "تراکنش قبلاً تایید شده است.",
        };
      }

      // شکست
      return {
        success: false,
        refNumber: "",
        cardPan: "",
        message: getPersianError(
          data.error_code || data.status,
          `خطای آیدی‌پی: کد ${data.error_code}`,
        ),
      };
    } catch (error) {
      const axiosErr = error as AxiosError;
      throw new Error(
        `خطا در تایید پرداخت آیدی‌پی: ${axiosErr.response ? JSON.stringify(axiosErr.response.data) : axiosErr.message}`,
      );
    }
  },
};

// ==================== پیاده‌سازی درگاه پی‌آی‌آر ====================

const payirGateway = {
  sendUrl: "https://pay.ir/pg/send",
  verifyUrl: "https://pay.ir/pg/verify",
  paymentPage: "https://pay.ir/pg/",

  /** ایجاد پرداخت در پی‌آی‌آر */
  async createPayment(
    amount: number,
    description: string,
    callbackUrl: string,
    orderId?: string,
  ): Promise<GatewayPaymentResult> {
    const payload: Record<string, any> = {
      api: PAYIR_API_KEY,
      amount, // پی‌آی‌آر ریال دریافت می‌کند
      redirect: callbackUrl,
      description,
    };

    // پی‌آی‌آر orderId را به عنوان factorNumber قبول می‌کند
    if (orderId) {
      payload.factorNumber = orderId;
    }

    try {
      const response = await axios.post(this.sendUrl, payload, {
        ...axiosConfig,
        // پی‌آی‌آر ممکن است فرمت‌های متفاوتی قبول کند
        headers: {
          ...axiosConfig.headers,
        },
      });

      const { data } = response;

      if (data.status === 1 && data.token) {
        return {
          paymentUrl: `${this.paymentPage}${data.token}`,
          transactionId: data.token,
        };
      }

      throw new Error(
        getPersianError(
          data.statusCode || data.status || -1,
          data.errorMessage || `خطای پی‌آی‌آر: ${JSON.stringify(data)}`,
        ),
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("خطای پی‌آی‌آر")) {
        throw error;
      }
      const axiosErr = error as AxiosError;
      throw new Error(
        `خطا در اتصال به پی‌آی‌آر: ${axiosErr.response ? JSON.stringify(axiosErr.response.data) : axiosErr.message}`,
      );
    }
  },

  /** تایید پرداخت در پی‌آی‌آر */
  async verifyPayment(
    token: string,
    amount: number,
  ): Promise<GatewayVerifyResult> {
    const payload = {
      api: PAYIR_API_KEY,
      token,
    };

    try {
      const response = await axios.post(this.verifyUrl, payload, {
        ...axiosConfig,
      });

      const { data } = response;

      if (data.status === 1) {
        // پرداخت موفق
        return {
          success: true,
          refNumber: data.transId?.toString() || "",
          cardPan: data.cardNumber || "",
          amount: data.amount,
        };
      }

      // شکست
      return {
        success: false,
        refNumber: "",
        cardPan: "",
        message: getPersianError(
          data.statusCode || data.status || -1,
          data.errorMessage ||
            `خطای پی‌آی‌آر: کد ${data.statusCode || data.status}`,
        ),
      };
    } catch (error) {
      const axiosErr = error as AxiosError;
      throw new Error(
        `خطا در تایید پرداخت پی‌آی‌آر: ${axiosErr.response ? JSON.stringify(axiosErr.response.data) : axiosErr.message}`,
      );
    }
  },
};

// ==================== رابط یکپارچه درگاه‌ها ====================

/**
 * دریافت نمونه درگاه فعال
 */
function getGateway(gatewayName?: string) {
  const name = gatewayName || DEFAULT_GATEWAY;

  switch (name) {
    case "zarinpal":
      return zarinpalGateway;
    case "idpay":
      return idpayGateway;
    case "payir":
      return payirGateway;
    default:
      throw new Error(
        `درگاه پرداخت "${name}" پشتیبانی نمی‌شود. درگاه‌های مجاز: zarinpal, idpay, payir`,
      );
  }
}

/**
 * استخراج پارامترهای تایید از درخواست بر اساس نوع درگاه
 */
function extractVerifyParams(
  req: Request,
  gatewayName: string,
): { authority: string; status?: string } {
  switch (gatewayName) {
    // زرین‌پال: Authority و Status در کوئری‌استرینگ
    case "zarinpal": {
      const authority =
        (req.query.Authority as string) ||
        (req.query.authority as string) ||
        "";
      const status =
        (req.query.Status as string) || (req.query.status as string) || "";
      return { authority, status };
    }
    // آیدی‌پی: id و status در کوئری‌استرینگ
    case "idpay": {
      const id = (req.query.id as string) || "";
      const status = (req.query.status as string) || "";
      return { authority: id, status };
    }
    // پی‌آی‌آر: token در کوئری‌استرینگ
    case "payir": {
      const token = (req.query.token as string) || "";
      const status = (req.query.status as string) || "";
      return { authority: token, status };
    }
    default:
      return { authority: "", status: "" };
  }
}

// ==================== فعال‌سازی ویژگی خریداری‌شده ====================

/**
 * فعال‌سازی قابلیت خریداری‌شده پس از پرداخت موفق
 * این تابع باید بر اساس منطق کسب‌وکار شما سفارشی‌سازی شود
 */
async function activatePurchasedFeature(payment: IPayment): Promise<void> {
  const meta = payment.metadata || {};

  switch (meta.type) {
    case "vip": {
      // فعال‌سازی اشتراک VIP کاربر
      // مثال: await User.findByIdAndUpdate(payment.user, { isVip: true, vipExpiresAt: ... });
      console.log(
        `✅ اشتراک VIP برای کاربر ${payment.user} فعال شد (مدت: ${meta.duration || 30} روز)`,
      );
      break;
    }
    case "ad_boost": {
      // تقویت آگهی
      // مثال: await Ad.findByIdAndUpdate(meta.relatedId, { isBoosted: true, boostedAt: new Date() });
      console.log(`✅ آگهی ${meta.relatedId} تقویت شد`);
      break;
    }
    case "ad_renewal": {
      // تمدید آگهی
      // مثال: await Ad.findByIdAndUpdate(meta.relatedId, { expiresAt: ... });
      console.log(`✅ آگهی ${meta.relatedId} تمدید شد`);
      break;
    }
    case "listing_fee": {
      // پرداخت هزینه ثبت آگهی
      console.log(`✅ هزینه ثبت آگهی برای کاربر ${payment.user} پرداخت شد`);
      break;
    }
    default: {
      // پرداخت عمومی - متادیتا را لاگ می‌کنیم
      console.log(
        `✅ پرداخت ${payment._id} با موفقیت انجام شد. نوع: ${meta.type || "نامشخص"}`,
      );
    }
  }
}

// ==================== کنترلرها ====================

/**
 * POST /api/payments/create
 * ایجاد درخواست پرداخت جدید
 */
export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user; // فرض: احراز هویت از طریق middleware انجام شده
    const userId = user?.id || user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "لطفاً ابتدا وارد حساب کاربری خود شوید.",
      });
    }

    const body: CreatePaymentBody = req.body;
    const { amount, description, orderId, callbackUrl, gateway, metadata } =
      body;

    // --- اعتبارسنجی مبلغ ---
    if (!amount || typeof amount !== "number") {
      return res.status(400).json({
        success: false,
        message: "مبلغ الزامی است و باید عدد باشد.",
      });
    }

    // حداقل مبلغ ۱۰,۰۰۰ ریال
    if (amount < 10000) {
      return res.status(400).json({
        success: false,
        message: `حداقل مبلغ پرداخت ${formatAmountPersian(10000)} است.`,
      });
    }

    // حداکثر مبلغ ۵۰۰,۰۰۰,۰۰۰ ریال (۵۰ میلیون تومان)
    if (amount > 500_000_000) {
      return res.status(400).json({
        success: false,
        message: "حداکثر مبلغ پرداخت در هر تراکنش ۵۰,۰۰۰,۰۰۰ تومان است.",
      });
    }

    // --- اعتبارسنجی توضیحات ---
    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length < 3
    ) {
      return res.status(400).json({
        success: false,
        message: "توضیحات پرداخت الزامی است و باید حداقل ۳ کاراکتر باشد.",
      });
    }

    // --- انتخاب درگاه ---
    const selectedGateway = gateway || DEFAULT_GATEWAY;
    const gatewayInstance = getGateway(selectedGateway);

    // --- آدرس بازگشت ---
    const finalCallbackUrl = callbackUrl || `${BASE_URL}/api/payments/verify`;

    // --- ایجاد رکورد پرداخت در دیتابیس ---
    const payment = new Payment({
      user: userId,
      amount,
      description: description.trim(),
      gateway: selectedGateway,
      status: "pending",
      callbackUrl: finalCallbackUrl,
      ip: getClientIp(req),
      orderId,
      metadata: metadata || {},
    });

    await payment.save();

    // --- فراخوانی درگاه پرداخت ---
    const gatewayResult = await gatewayInstance.createPayment(
      amount,
      description.trim(),
      finalCallbackUrl,
      orderId,
    );

    // --- بروزرسانی رکورد پرداخت با شناسه‌های درگاه ---
    payment.transactionId = gatewayResult.transactionId;
    payment.authorityCode = gatewayResult.transactionId;
    payment.status = "processing";
    await payment.save();

    // --- بازگشت پاسخ ---
    return res.status(200).json({
      success: true,
      paymentUrl: gatewayResult.paymentUrl,
      paymentId: payment._id.toString(),
      amount: payment.amount,
      amountFormatted: formatAmountPersian(payment.amount),
      gateway: selectedGateway,
      message:
        "درگاه پرداخت با موفقیت ایجاد شد. کاربر را به آدرس paymentUrl هدایت کنید.",
    });
  } catch (error) {
    console.error("❌ خطا در ایجاد پرداخت:", error);
    next(error);
  }
}

/**
 * GET /api/payments/verify
 * بازگشت از درگاه پرداخت - کاربر پس از پرداخت به این آدرس هدایت می‌شود
 */
export async function verifyPayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // --- استخراج پارامترها از کوئری‌استرینگ ---
    // زرین‌پال: ?Authority=xxx&Status=OK
    // آیدی‌پی: ?id=xxx&status=10
    // پی‌آی‌آر: ?token=xxx&status=1

    // ابتدا تشخیص درگاه از روی پارامترهای موجود
    let gatewayName: string | undefined;
    let authorityCode: string;

    if (req.query.Authority || req.query.authority) {
      gatewayName = "zarinpal";
      authorityCode =
        (req.query.Authority as string) || (req.query.authority as string);
    } else if (req.query.id) {
      gatewayName = "idpay";
      authorityCode = req.query.id as string;
    } else if (req.query.token) {
      gatewayName = "payir";
      authorityCode = req.query.token as string;
    } else {
      // فال‌بک: جستجو در دیتابیس
      return res.redirect(
        `${FRONTEND_URL}/payment/result?status=error&message=${encodeURIComponent("پارامترهای بازگشت نامعتبر است.")}`,
      );
    }

    const params = extractVerifyParams(req, gatewayName);

    if (!params.authority) {
      return res.redirect(
        `${FRONTEND_URL}/payment/result?status=error&message=${encodeURIComponent("شناسه تراکنش یافت نشد.")}`,
      );
    }

    // --- بررسی Idempotency: آیا تراکنش قبلاً پردازش شده؟ ---
    const alreadyProcessed = await Payment.isAlreadyProcessed(params.authority);
    if (alreadyProcessed) {
      const existingPayment = await Payment.findOne({
        authorityCode: params.authority,
      });
      return res.redirect(
        `${FRONTEND_URL}/payment/result?status=already-processed&paymentId=${existingPayment?._id || ""}`,
      );
    }

    // --- جستجوی رکورد پرداخت ---
    const payment = await Payment.findOne({
      $or: [
        { authorityCode: params.authority },
        { transactionId: params.authority },
      ],
    });

    if (!payment) {
      return res.redirect(
        `${FRONTEND_URL}/payment/result?status=error&message=${encodeURIComponent("تراکنش مورد نظر در سیستم یافت نشد.")}`,
      );
    }

    // --- بررسی وضعیت کاربر در زرین‌پال (Status=OK یا NOK) ---
    if (gatewayName === "zarinpal") {
      const zarinpalStatus = (req.query.Status as string)?.toUpperCase();
      if (zarinpalStatus === "NOK") {
        payment.status = "failed";
        payment.failureReason = "پرداخت توسط کاربر لغو شد.";
        await payment.save();

        return res.redirect(
          `${FRONTEND_URL}/payment/result?status=cancelled&paymentId=${payment._id}&message=${encodeURIComponent("پرداخت توسط شما لغو شد.")}`,
        );
      }
    }

    // --- بررسی وضعیت در آیدی‌پی ---
    if (gatewayName === "idpay") {
      const idpayStatus = parseInt(req.query.status as string);
      if (idpayStatus === 21) {
        // کاربر لغو کرده
        payment.status = "failed";
        payment.failureReason = "پرداخت توسط کاربر لغو شد.";
        await payment.save();

        return res.redirect(
          `${FRONTEND_URL}/payment/result?status=cancelled&paymentId=${payment._id}`,
        );
      }
    }

    // --- تایید پرداخت با درگاه ---
    const gatewayInstance = getGateway(gatewayName);
    const verifyResult = await gatewayInstance.verifyPayment(
      params.authority,
      payment.amount,
    );

    if (verifyResult.success) {
      // --- پرداخت موفق ---
      payment.status = "success";
      payment.refNumber = verifyResult.refNumber;
      payment.cardPan = verifyResult.cardPan;
      payment.verifiedAt = new Date();
      payment.failureReason = undefined;
      await payment.save();

      // --- فعال‌سازی ویژگی خریداری‌شده ---
      try {
        await activatePurchasedFeature(payment);
      } catch (activationError) {
        console.error(
          "⚠️ خطا در فعال‌سازی ویژگی (پرداخت موفق بود):",
          activationError,
        );
        // پرداخت موفق بوده ولی فعال‌سازی با خطا مواجه شده
        // لاگ می‌کنیم ولی کاربر را به صفحه موفقیت هدایت می‌کنیم
      }

      // --- هدایت کاربر به صفحه موفقیت ---
      const successParams = new URLSearchParams({
        status: "success",
        paymentId: payment._id.toString(),
        refNumber: verifyResult.refNumber,
        amount: formatAmountPersian(payment.amount),
        gateway: gatewayName || payment.gateway,
      });

      return res.redirect(
        `${FRONTEND_URL}/payment/result?${successParams.toString()}`,
      );
    } else {
      // --- پرداخت ناموفق ---
      payment.status = "failed";
      payment.failureReason = verifyResult.message || "تراکنش ناموفق بود.";
      await payment.save();

      const failParams = new URLSearchParams({
        status: "failed",
        paymentId: payment._id.toString(),
        message: encodeURIComponent(
          verifyResult.message || "تراکنش ناموفق بود. لطفاً دوباره تلاش کنید.",
        ),
        gateway: gatewayName || payment.gateway,
      });

      return res.redirect(
        `${FRONTEND_URL}/payment/result?${failParams.toString()}`,
      );
    }
  } catch (error) {
    console.error("❌ خطا در تایید پرداخت:", error);
    // هدایت کاربر به صفحه خطا حتی در صورت بروز خطای سرور
    return res.redirect(
      `${FRONTEND_URL}/payment/result?status=error&message=${encodeURIComponent("خطایی در پردازش پرداخت رخ داد. لطفاً با پشتیبانی تماس بگیرید.")}`,
    );
  }
}

/**
 * POST /api/payments/verify-webhook
 * تایید سرور به سرور (برای درگاه‌هایی که وب‌هوک ارسال می‌کنند)
 */
export async function verifyWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { body, headers } = req;

    // --- تشخیص درگاه از روی هدرها یا بادی ---
    let gatewayName: string;
    let authorityCode: string;

    if (headers["x-idpay-signature"]) {
      // وب‌هوک آیدی‌پی
      gatewayName = "idpay";

      // --- بررسی امضای دیجیتال آیدی‌پی ---
      // TODO: پیاده‌سازی بررسی امضا با کلید خصوصی
      // const signature = headers['x-idpay-signature'] as string;
      // const isValid = verifyIdpaySignature(body, signature, IDPAY_API_KEY);
      // if (!isValid) { ... }

      authorityCode = body.id;
    } else if (body.token) {
      // وب‌هوک پی‌آی‌آر
      gatewayName = "payir";
      authorityCode = body.token;
    } else if (body.Authority || body.authority) {
      // وب‌هوک زرین‌پال
      gatewayName = "zarinpal";
      authorityCode = body.Authority || body.authority;
    } else {
      return res.status(400).json({
        success: false,
        message: "درگاه پرداخت قابل تشخیص نیست.",
      });
    }

    // --- بررسی Idempotency ---
    const alreadyProcessed = await Payment.isAlreadyProcessed(authorityCode);
    if (alreadyProcessed) {
      return res.status(200).json({
        success: true,
        message: "تراکنش قبلاً پردازش شده است.",
      });
    }

    // --- جستجوی رکورد پرداخت ---
    const payment = await Payment.findOne({
      $or: [{ authorityCode }, { transactionId: authorityCode }],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "تراکنش مورد نظر یافت نشد.",
      });
    }

    // --- تایید با درگاه ---
    const gatewayInstance = getGateway(gatewayName);
    const verifyResult = await gatewayInstance.verifyPayment(
      authorityCode,
      payment.amount,
    );

    if (verifyResult.success) {
      payment.status = "success";
      payment.refNumber = verifyResult.refNumber;
      payment.cardPan = verifyResult.cardPan;
      payment.verifiedAt = new Date();
      payment.failureReason = undefined;
      await payment.save();

      try {
        await activatePurchasedFeature(payment);
      } catch (err) {
        console.error("⚠️ خطا در فعال‌سازی ویژگی:", err);
      }

      return res.status(200).json({
        success: true,
        message: "پرداخت با موفقیت تایید شد.",
        paymentId: payment._id,
      });
    }

    payment.status = "failed";
    payment.failureReason = verifyResult.message;
    await payment.save();

    return res.status(400).json({
      success: false,
      message: verifyResult.message || "تایید پرداخت ناموفق بود.",
    });
  } catch (error) {
    console.error("❌ خطا در وب‌هوک پرداخت:", error);
    next(error);
  }
}

/**
 * GET /api/payments/:id/status
 * بررسی وضعیت پرداخت
 */
export async function getPaymentStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const paymentId = req.params.id;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "شناسه پرداخت الزامی است.",
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "پرداخت مورد نظر یافت نشد.",
      });
    }

    // بررسی دسترسی: فقط صاحب پرداخت یا ادمین می‌تواند ببیند
    if (
      payment.user.toString() !== userId?.toString() &&
      user?.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "شما دسترسی به این پرداخت را ندارید.",
      });
    }

    return res.status(200).json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        gateway: payment.gateway,
        amount: payment.amount,
        amountFormatted: formatAmountPersian(payment.amount),
        refNumber: payment.refNumber,
        cardPan: payment.cardPan
          ? `**** **** **** ${payment.cardPan}`
          : undefined,
        description: payment.description,
        orderId: payment.orderId,
        createdAt: payment.createdAt,
        verifiedAt: payment.verifiedAt,
        failureReason: payment.failureReason,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/user/payments
 * دریافت تاریخچه پرداخت‌های کاربر (صفحه‌بندی شده)
 */
export async function getUserPayments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "لطفاً ابتدا وارد حساب کاربری خود شوید.",
      });
    }

    // پارامترهای صفحه‌بندی و فیلتر
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 10),
    );
    const status = req.query.status as string;
    const gateway = req.query.gateway as string;

    // ساخت فیلتر
    const filter: Record<string, any> = { user: userId };
    if (
      status &&
      [
        "pending",
        "processing",
        "success",
        "failed",
        "refunded",
        "expired",
      ].includes(status)
    ) {
      filter.status = status;
    }
    if (gateway && ["zarinpal", "idpay", "payir"].includes(gateway)) {
      filter.gateway = gateway;
    }

    const skip = (page - 1) * limit;

    // دریافت پرداخت‌ها
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-ip -__v -metadata"),
      Payment.countDocuments(filter),
    ]);

    // محاسبه آمار
    const stats = await Payment.aggregate([
      { $match: { user: new (require("mongoose").Types.ObjectId)(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const statusMap: Record<string, { count: number; total: number }> = {};
    for (const stat of stats) {
      statusMap[stat._id] = { count: stat.count, total: stat.total };
    }

    return res.status(200).json({
      success: true,
      data: payments.map((p) => ({
        id: p._id,
        status: p.status,
        gateway: p.gateway,
        amount: p.amount,
        amountFormatted: formatAmountPersian(p.amount),
        refNumber: p.refNumber,
        cardPan: p.cardPan ? `**** **** **** ${p.cardPan}` : undefined,
        description: p.description,
        orderId: p.orderId,
        createdAt: p.createdAt,
        verifiedAt: p.verifiedAt,
        failureReason: p.failureReason,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        successCount: statusMap["success"]?.count || 0,
        successTotal: statusMap["success"]?.total || 0,
        failedCount: statusMap["failed"]?.count || 0,
        pendingCount: statusMap["pending"]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/payments
 * ادمین: دریافت همه پرداخت‌ها با فیلتر
 */
export async function getAdminPayments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user;

    // بررسی دسترسی ادمین
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "دسترسی ادمین لازم است.",
      });
    }

    // پارامترهای صفحه‌بندی و فیلتر
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20),
    );
    const status = req.query.status as string;
    const gateway = req.query.gateway as string;
    const userId = req.query.userId as string;
    const orderId = req.query.orderId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const search = req.query.search as string; // جستجو در توضیحات یا refNumber

    // ساخت فیلتر
    const filter: Record<string, any> = {};

    if (
      status &&
      [
        "pending",
        "processing",
        "success",
        "failed",
        "refunded",
        "expired",
      ].includes(status)
    ) {
      filter.status = status;
    }
    if (gateway && ["zarinpal", "idpay", "payir"].includes(gateway)) {
      filter.gateway = gateway;
    }
    if (userId) {
      filter.user = userId;
    }
    if (orderId) {
      filter.orderId = orderId;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { refNumber: { $regex: search, $options: "i" } },
        { "metadata.mobile": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // دریافت پرداخت‌ها با populate کاربر
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email phone mobile")
        .lean(),
      Payment.countDocuments(filter),
    ]);

    // آمار کلی
    const overallStats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          totalAmount: { $sum: "$amount" },
          successAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "success"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const stats = overallStats[0] || {
      totalCount: 0,
      successCount: 0,
      failedCount: 0,
      totalAmount: 0,
      successAmount: 0,
    };

    // آمار بر اساس درگاه
    const gatewayStats = await Payment.aggregate([
      {
        $group: {
          _id: "$gateway",
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
          },
          totalAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "success"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: payments.map((p: any) => ({
        id: p._id,
        user: p.user,
        status: p.status,
        gateway: p.gateway,
        amount: p.amount,
        amountFormatted: formatAmountPersian(p.amount),
        refNumber: p.refNumber,
        cardPan: p.cardPan ? `**** **** **** ${p.cardPan}` : undefined,
        description: p.description,
        orderId: p.orderId,
        transactionId: p.transactionId,
        authorityCode: p.authorityCode,
        ip: p.ip,
        metadata: p.metadata,
        createdAt: p.createdAt,
        verifiedAt: p.verifiedAt,
        failureReason: p.failureReason,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalCount: stats.totalCount,
        successCount: stats.successCount,
        failedCount: stats.failedCount,
        totalAmount: stats.totalAmount,
        totalAmountFormatted: formatAmountPersian(stats.totalAmount),
        successAmount: stats.successAmount,
        successAmountFormatted: formatAmountPersian(stats.successAmount),
        successRate:
          stats.totalCount > 0
            ? `${((stats.successCount / stats.totalCount) * 100).toFixed(1)}%`
            : "0%",
      },
      gatewayStats: gatewayStats.map((gs: any) => ({
        gateway: gs._id,
        count: gs.count,
        successCount: gs.successCount,
        totalAmount: gs.totalAmount,
        totalAmountFormatted: formatAmountPersian(gs.totalAmount),
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/payments/refund/:id
 * ادمین: بازگشت وجه (Refund)
 * توجه: هر درگاه API مجزایی برای بازگشت وجه دارد
 */
export async function refundPayment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).user;

    // بررسی دسترسی ادمین
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "دسترسی ادمین لازم است.",
      });
    }

    const paymentId = req.params.id;
    const { reason } = req.body; // دلیل بازگشت وجه

    // --- جستجوی پرداخت ---
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "پرداخت مورد نظر یافت نشد.",
      });
    }

    // --- بررسی وضعیت فعلی ---
    if (payment.status !== "success") {
      return res.status(400).json({
        success: false,
        message: `فقط پرداخت‌های موفق قابل بازگشت وجه هستند. وضعیت فعلی: ${payment.status}`,
      });
    }

    if ((payment.status as string) === "refunded") {
      return res.status(400).json({
        success: false,
        message: "این پرداخت قبلاً بازگشت وجه شده است.",
      });
    }

    // --- بازگشت وجه بر اساس درگاه ---

    let refundSuccess = false;
    let refundMessage = "";

    switch (payment.gateway) {
      case "zarinpal": {
        // API بازگشت وجه زرین‌پال
        // POST https://api.zarinpal.com/pg/v4/payment/refund.json
        try {
          const response = await axios.post(
            "https://api.zarinpal.com/pg/v4/payment/refund.json",
            {
              merchant_id: ZARINPAL_MERCHANT_ID,
              amount: payment.amount,
              ref_id: parseInt(payment.refNumber),
            },
            {
              ...axiosConfig,
              headers: {
                ...axiosConfig.headers,
                Authorization: `Bearer ${ZARINPAL_MERCHANT_ID}`,
              },
            },
          );

          const { data } = response.data;
          if (data.code === 100) {
            refundSuccess = true;
            refundMessage = "بازگشت وجه با موفقیت انجام شد.";
          } else {
            refundMessage = getPersianError(
              data.code,
              `خطا در بازگشت وجه زرین‌پال: کد ${data.code}`,
            );
          }
        } catch (err) {
          refundMessage = "خطا در اتصال به درگاه زرین‌پال برای بازگشت وجه.";
        }
        break;
      }

      case "idpay": {
        // API بازگشت وجه آیدی‌پی
        // POST https://api.idpay.ir/v1.1/payment/inquiry
        // آیدی‌پی مستقیماً API refund ندارد و باید از پنل یا تماس با پشتیبانی استفاده شود
        refundMessage =
          "بازگشت وجه آیدی‌پی باید از طریق پنل مدیریت یا تماس با پشتیبانی آیدی‌پی انجام شود.";
        // در اینجا ما فقط وضعیت را در سیستم بروز می‌کنیم
        refundSuccess = true; // ادمین تایید کرده
        break;
      }

      case "payir": {
        // پی‌آی‌آر API مستقیم برای refund ندارد
        refundMessage =
          "بازگشت وجه پی‌آی‌آر باید از طریق پنل مدیریت یا تماس با پشتیبانی پی‌آی‌آر انجام شود.";
        refundSuccess = true; // ادمین تایید کرده
        break;
      }

      default:
        refundMessage = "درگاه پرداخت نامشخص.";
    }

    if (refundSuccess) {
      // --- بروزرسانی رکورد پرداخت ---
      payment.status = "refunded";
      payment.failureReason = reason || refundMessage;
      payment.verifiedAt = new Date();

      // ذخیره اطلاعات بازگشت وجه در متادیتا
      payment.metadata = {
        ...payment.metadata,
        refundedBy: user._id,
        refundedAt: new Date(),
        refundReason: reason || "بازگشت وجه توسط ادمین",
      };

      await payment.save();

      // TODO: لغو فعال‌سازی ویژگی خریداری‌شده (مثلاً لغو VIP)

      return res.status(200).json({
        success: true,
        message: refundMessage,
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          amountFormatted: formatAmountPersian(payment.amount),
          refNumber: payment.refNumber,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: refundMessage,
    });
  } catch (error) {
    console.error("❌ خطا در بازگشت وجه:", error);
    next(error);
  }
}

// ==================== میدل‌ور خطای پرداخت ====================

/**
 * هندلر خطای اختصاصی برای کنترلر پرداخت
 */
export function paymentErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error("=== خطای کنترلر پرداخت ===");
  console.error("مسیر:", req.path);
  console.error("پیام:", err.message);
  console.error("استک:", err.stack);

  // بررسی خطای تایم‌اوت
  if (
    err.message?.includes("timeout") ||
    err.message?.includes("ECONNABORTED")
  ) {
    return res.status(408).json({
      success: false,
      message:
        "زمان اتصال به درگاه پرداخت به پایان رسید. لطفاً دوباره تلاش کنید.",
      code: "GATEWAY_TIMEOUT",
    });
  }

  // بررسی خطای اتصال
  if (
    err.message?.includes("ECONNREFUSED") ||
    err.message?.includes("ENOTFOUND")
  ) {
    return res.status(502).json({
      success: false,
      message: "درگاه پرداخت در دسترس نیست. لطفاً بعداً تلاش کنید.",
      code: "GATEWAY_UNAVAILABLE",
    });
  }

  // خطای پیش‌فرض
  return res.status(500).json({
    success: false,
    message: "خطای داخلی سرور. لطفاً با پشتیبانی تماس بگیرید.",
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { detail: err.message }),
  });
}

// ==================== خروجی‌ها ====================

export default {
  createPayment,
  verifyPayment,
  verifyWebhook,
  getPaymentStatus,
  getUserPayments,
  getAdminPayments,
  refundPayment,
  paymentErrorHandler,
};
