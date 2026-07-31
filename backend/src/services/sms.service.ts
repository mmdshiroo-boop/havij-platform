import axios, { AxiosError } from "axios";
import { SmsLog } from "../models/sms.model";

/**
 * ============================================
 * سرویس ارسال پیامک ملی پیامک (Meli Payamak)
 * ============================================
 * این سرویس تمامی عملیات مربوط به ارسال پیامک از طریق
 * وب‌سرویس ملی پیامک را پوشش می‌دهد.
 *
 * وب‌سرویس ملی پیامک بر پایه SOAP/XML کار می‌کند.
 */

/** آدرس وب‌سرویس ملی پیامک */
const MELI_PAYAMAK_ENDPOINT = "https://api.payamakapi.com/post/Send.asmx";

/** حداکثر تعداد گیرنده در هر درخواست ارسال */
const MAX_RECIPIENTS_PER_REQUEST = 100;

/** تأخیر بین ارسال دسته‌ای (میلی‌ثانیه) */
const BULK_DELAY_MS = 1000;

/** تنظیمات اولیه سرویس */
export interface SmsServiceConfig {
  /** شماره ارسال (نام کاربری) */
  username: string;
  /** رمز عبور وب‌سرویس */
  password: string;
  /** شماره خط ارسال */
  fromNumber: string;
}

/** نتیجه ارسال پیامک */
export interface SendSMSResult {
  /** آیا ارسال موفق بود */
  success: boolean;
  /** شناسه پیام از درگاه */
  messageId?: string;
  /** متن خطا */
  error?: string;
  /** هزینه پیامک (تومان) */
  cost?: number;
}

/** وضعیت تحویل پیامک */
export interface DeliveryStatus {
  /** آیا به دست گیرنده رسیده */
  delivered: boolean;
  /** کد وضعیت */
  status: number;
  /** متن وضعیت */
  statusText: string;
}

/** موجودی حساب */
export interface CreditBalance {
  /** تعداد پیامک باقیمانده */
  remaining: number;
  /** تعداد پیامک استفاده شده */
  used: number;
}

/** کدهای خطای رایج ملی پیامک */
const ERROR_CODES: Record<string, string> = {
  "0": "ارسال موفق",
  "1": "نام کاربری یا رمز عبور اشتباه است",
  "2": "اعتبار کافی نیست",
  "3": "محدودیت ارسال روزانه رعایت نشده است",
  "4": "محدودیت ارسال ساعتی رعایت نشده است",
  "5": "شماره گیرنده نامعتبر است",
  "6": "متن پیام نامعتبر است",
  "7": "شماره فرستنده نامعتبر است",
  "8": "خط فرستنده فعال نیست",
  "9": "پارامترهای ورودی ناقص است",
  "10": "کاربر مسدود شده است",
  "11": "ارسال به تمامی گیرندگان ناموفق بود",
  "12": "ارسال به برخی گیرندگان ناموفق بود",
  "13": "سرویس پیامک موقتاً غیرفعال است",
  "14": "فرمت درخواست نامعتبر است",
  "20": "شماره گیرنده در لیست سیاه قرار دارد",
  "21": "پیش‌شماره گیرنده مجاز نیست",
  "22": "طول پیام بیش از حد مجاز است",
  "30": "خطای داخلی سرور",
  "31": "تایم‌اوت در اتصال به سرور",
  "32": "خطای ناشناخته",
};

class SmsService {
  private username: string;
  private password: string;
  private fromNumber: string;

  constructor(config: SmsServiceConfig) {
    this.username = config.username;
    this.password = config.password;
    this.fromNumber = config.fromNumber;
  }

  // ─────────────────────────────────────────
  // روش‌های عمومی ارسال پیامک
  // ─────────────────────────────────────────

  /**
   * ارسال پیامک به یک یا چند شماره
   * @param to - شماره گیرنده یا آرایه‌ای از شماره‌ها
   * @param text - متن پیامک
   * @param options - گزینه‌های ارسال (زمان‌بندی)
   * @returns نتیجه ارسال
   */
  async sendSMS(
    to: string | string[],
    text: string,
    options?: { sendAt?: Date },
  ): Promise<SendSMSResult> {
    try {
      // نرمال‌سازی شماره گیرنده
      const recipients = Array.isArray(to) ? to : [to];
      const normalizedRecipients = recipients.map((r) =>
        this.formatPersianNumber(r),
      );

      // بررسی تعداد گیرندگان
      if (normalizedRecipients.length === 0) {
        return {
          success: false,
          error: "حداقل یک شماره گیرنده باید وارد شود",
        };
      }

      // تقسیم به دسته‌های حداکثر ۱۰۰ تایی
      const batches = this.chunkArray(
        normalizedRecipients,
        MAX_RECIPIENTS_PER_REQUEST,
      );

      let lastResult: SendSMSResult | null = null;

      for (const batch of batches) {
        const recipientString = batch.join(",");

        const params: Record<string, string> = {
          username: this.username,
          password: this.password,
          from: this.fromNumber,
          to: recipientString,
          text: text,
        };

        // اضافه کردن زمان ارسال در صورت زمان‌بندی
        if (options?.sendAt) {
          const sendTime = this.formatDateForApi(options.sendAt);
          params["sendTime"] = sendTime;
        }

        const responseXml = await this.callSoapMethod("SendSimpleSMS2", params);
        const parsed = this.parseSoapResponse(responseXml);
        const body = parsed.body?.SendSimpleSMS2Response?.SendSimpleSMS2Result;

        // بررسی خطای API
        if (body && this.isErrorCode(body)) {
          lastResult = {
            success: false,
            error: ERROR_CODES[body] || `خطای نامشخص: کد ${body}`,
          };
          continue;
        }

        // ثبت لاگ ارسال موفق
        await this.logSms({
          recipient: recipientString,
          message: text,
          type: "custom",
          messageId: body || undefined,
          status: "sent",
          cost: this.calculateCost(text, batch.length),
        });

        lastResult = {
          success: true,
          messageId: body || undefined,
          cost: this.calculateCost(text, batch.length),
        };
      }

      return (
        lastResult || {
          success: false,
          error: "نتیجه‌ای از سرور دریافت نشد",
        }
      );
    } catch (error) {
      return this.handleServiceError(error);
    }
  }

  /**
   * ارسال کد تأیید (OTP)
   * @param to - شماره گیرنده
   * @param code - کد تأیید
   * @returns نتیجه ارسال
   */
  async sendOTP(to: string, code: string): Promise<SendSMSResult> {
    const text = `کد تایید شما: ${code}\nسایت املاک\nمعتبر تا ۲ دقیقه`;

    try {
      const normalizedTo = this.formatPersianNumber(to);
      const params: Record<string, string> = {
        username: this.username,
        password: this.password,
        from: this.fromNumber,
        to: normalizedTo,
        text: text,
      };

      const responseXml = await this.callSoapMethod("SendSimpleSMS2", params);
      const parsed = this.parseSoapResponse(responseXml);
      const body = parsed.body?.SendSimpleSMS2Response?.SendSimpleSMS2Result;

      // بررسی خطا
      if (body && this.isErrorCode(body)) {
        await this.logSms({
          recipient: normalizedTo,
          message: text,
          type: "otp",
          status: "failed",
        });
        return {
          success: false,
          error: ERROR_CODES[body] || `خطای نامشخص: کد ${body}`,
        };
      }

      // ثبت لاگ موفق
      await this.logSms({
        recipient: normalizedTo,
        message: text,
        type: "otp",
        messageId: body || undefined,
        status: "sent",
        cost: this.calculateCost(text, 1),
      });

      return {
        success: true,
        messageId: body || undefined,
        cost: this.calculateCost(text, 1),
      };
    } catch (error) {
      return this.handleServiceError(error);
    }
  }

  /**
   * ارسال اطلاعیه انتشار آگهی
   * @param to - شماره گیرنده
   * @param adTitle - عنوان آگهی
   * @param adUrl - لینک آگهی
   * @returns نتیجه ارسال
   */
  async sendAdNotification(
    to: string,
    adTitle: string,
    adUrl: string,
  ): Promise<SendSMSResult> {
    const text = `آگهی شما «${adTitle}» منتشر شد.\n${adUrl}`;

    try {
      const normalizedTo = this.formatPersianNumber(to);
      const params: Record<string, string> = {
        username: this.username,
        password: this.password,
        from: this.fromNumber,
        to: normalizedTo,
        text: text,
      };

      const responseXml = await this.callSoapMethod("SendSimpleSMS2", params);
      const parsed = this.parseSoapResponse(responseXml);
      const body = parsed.body?.SendSimpleSMS2Response?.SendSimpleSMS2Result;

      if (body && this.isErrorCode(body)) {
        await this.logSms({
          recipient: normalizedTo,
          message: text,
          type: "notification",
          status: "failed",
        });
        return {
          success: false,
          error: ERROR_CODES[body] || `خطای نامشخص: کد ${body}`,
        };
      }

      await this.logSms({
        recipient: normalizedTo,
        message: text,
        type: "notification",
        messageId: body || undefined,
        status: "sent",
        cost: this.calculateCost(text, 1),
      });

      return {
        success: true,
        messageId: body || undefined,
        cost: this.calculateCost(text, 1),
      };
    } catch (error) {
      return this.handleServiceError(error);
    }
  }

  /**
   * ارسال پیامک خوش‌آمدگویی به کاربر جدید
   * @param to - شماره گیرنده
   * @param name - نام کاربر
   * @returns نتیجه ارسال
   */
  async sendWelcomeSMS(to: string, name: string): Promise<SendSMSResult> {
    const text = `${name} عزیز، به سایت املاک خوش آمدید!`;

    try {
      const normalizedTo = this.formatPersianNumber(to);
      const params: Record<string, string> = {
        username: this.username,
        password: this.password,
        from: this.fromNumber,
        to: normalizedTo,
        text: text,
      };

      const responseXml = await this.callSoapMethod("SendSimpleSMS2", params);
      const parsed = this.parseSoapResponse(responseXml);
      const body = parsed.body?.SendSimpleSMS2Response?.SendSimpleSMS2Result;

      if (body && this.isErrorCode(body)) {
        await this.logSms({
          recipient: normalizedTo,
          message: text,
          type: "welcome",
          status: "failed",
        });
        return {
          success: false,
          error: ERROR_CODES[body] || `خطای نامشخص: کد ${body}`,
        };
      }

      await this.logSms({
        recipient: normalizedTo,
        message: text,
        type: "welcome",
        messageId: body || undefined,
        status: "sent",
        cost: this.calculateCost(text, 1),
      });

      return {
        success: true,
        messageId: body || undefined,
        cost: this.calculateCost(text, 1),
      };
    } catch (error) {
      return this.handleServiceError(error);
    }
  }

  // ─────────────────────────────────────────
  // بررسی وضعیت و موجودی
  // ─────────────────────────────────────────

  /**
   * بررسی وضعیت تحویل پیامک
   * @param messageId - شناسه پیام از درگاه
   * @returns وضعیت تحویل
   */
  async getDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      const params: Record<string, string> = {
        username: this.username,
        password: this.password,
        recId: messageId,
      };

      const responseXml = await this.callSoapMethod("GetDeliveries", params);
      const parsed = this.parseSoapResponse(responseXml);
      const body = parsed.body?.GetDeliveriesResponse?.GetDeliveriesResult;

      // تحلیل وضعیت تحویل
      const status = parseInt(body || "0", 10);
      const statusInfo = this.getDeliveryStatusInfo(status);

      // بروزرسانی لاگ در صورت تحویل
      if (statusInfo.delivered) {
        await SmsLog.updateOne(
          { messageId: messageId },
          {
            status: "delivered",
            deliveredAt: new Date(),
          },
        ).exec();
      }

      return statusInfo;
    } catch (error) {
      const message = error instanceof Error ? error.message : "خطای ناشناخته";
      return {
        delivered: false,
        status: -1,
        statusText: `خطا در بررسی وضعیت: ${message}`,
      };
    }
  }

  /**
   * دریافت موجودی حساب پیامک
   * @returns اطلاعات موجودی
   */
  async getCreditBalance(): Promise<CreditBalance> {
    try {
      const params: Record<string, string> = {
        username: this.username,
        password: this.password,
      };

      const responseXml = await this.callSoapMethod("GetCredit", params);
      const parsed = this.parseSoapResponse(responseXml);
      const body = parsed.body?.GetCreditResponse?.GetCreditResult;

      // پاسخ GetCredit معمولاً یک عدد رشته‌ای است
      const remaining = parseFloat(body || "0");

      return {
        remaining: Math.floor(remaining),
        used: 0, // ملی پیامک تعداد استفاده شده را جدا برنمی‌گرداند
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "خطای ناشناخته";
      throw new Error(`خطا در دریافت موجودی: ${message}`);
    }
  }

  // ─────────────────────────────────────────
  // ارسال انبوه
  // ─────────────────────────────────────────

  /**
   * ارسال پیامک انبوه با قابلیت گزارش پیشرفت
   * @param recipients - آرایه شماره گیرندگان
   * @param text - متن پیامک
   * @param onProgress - تابع فراخوانی شده برای گزارش پیشرفت
   * @returns خلاصه نتایج ارسال
   */
  async sendBulkSMS(
    recipients: string[],
    text: string,
    onProgress?: (sent: number, total: number) => void,
  ): Promise<{
    totalSent: number;
    totalFailed: number;
    results: SendSMSResult[];
  }> {
    // نرمال‌سازی تمامی شماره‌ها
    const normalizedRecipients = recipients.map((r) =>
      this.formatPersianNumber(r),
    );
    const total = normalizedRecipients.length;

    // حذف شماره‌های تکراری
    const uniqueRecipients = [...new Set(normalizedRecipients)];

    // تقسیم به دسته‌های ۱۰۰ تایی
    const batches = this.chunkArray(
      uniqueRecipients,
      MAX_RECIPIENTS_PER_REQUEST,
    );

    const results: SendSMSResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const recipientString = batch.join(",");

      try {
        const params: Record<string, string> = {
          username: this.username,
          password: this.password,
          from: this.fromNumber,
          to: recipientString,
          text: text,
        };

        const responseXml = await this.callSoapMethod("SendSimpleSMS2", params);
        const parsed = this.parseSoapResponse(responseXml);
        const body = parsed.body?.SendSimpleSMS2Response?.SendSimpleSMS2Result;

        if (body && this.isErrorCode(body)) {
          const errorResult: SendSMSResult = {
            success: false,
            error: ERROR_CODES[body] || `خطای نامشخص: کد ${body}`,
          };
          results.push(errorResult);
          totalFailed += batch.length;

          // ثبت لاگ خطا
          await this.logSms({
            recipient: recipientString,
            message: text,
            type: "marketing",
            status: "failed",
          });
        } else {
          const successResult: SendSMSResult = {
            success: true,
            messageId: body || undefined,
            cost: this.calculateCost(text, batch.length),
          };
          results.push(successResult);
          totalSent += batch.length;

          // ثبت لاگ موفق
          await this.logSms({
            recipient: recipientString,
            message: text,
            type: "marketing",
            messageId: body || undefined,
            status: "sent",
            cost: this.calculateCost(text, batch.length),
          });
        }
      } catch (error) {
        const errorResult: SendSMSResult = {
          success: false,
          error:
            error instanceof Error ? error.message : "خطای ناشناخته در ارسال",
        };
        results.push(errorResult);
        totalFailed += batch.length;
      }

      // گزارش پیشرفت
      if (onProgress) {
        onProgress(i + 1, batches.length);
      }

      // تأخیر بین دسته‌ها (به جز دسته آخر)
      if (i < batches.length - 1) {
        await this.delay(BULK_DELAY_MS);
      }
    }

    return { totalSent, totalFailed, results };
  }

  /**
   * ارسال پیامک به تمامی مشاوران املاک
   * @param agents - آرایه مشاوران (شامل شماره تلفن)
   * @param text - متن پیامک
   * @returns خلاصه نتایج
   */
  async sendToAgents(
    agents: { phone: string }[],
    text: string,
  ): Promise<{
    totalSent: number;
    totalFailed: number;
  }> {
    const phoneNumbers = agents
      .map((agent) => agent.phone)
      .filter((phone) => phone && phone.trim().length > 0);

    if (phoneNumbers.length === 0) {
      return { totalSent: 0, totalFailed: 0 };
    }

    const result = await this.sendBulkSMS(phoneNumbers, text);
    return {
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
    };
  }

  // ─────────────────────────────────────────
  // متدهای کمکی SOAP/XML
  // ─────────────────────────────────────────

  /**
   * ساخت پاکت SOAP برای درخواست به وب‌سرویس
   * @param method - نام متد (مثلاً SendSimpleSMS2)
   * @param params - پارامترهای متد
   * @returns رشته XML کامل SOAP
   */
  private buildSoapEnvelope(
    method: string,
    params: Record<string, string>,
  ): string {
    // ساخت پارامترهای XML
    const paramsXml = Object.entries(params)
      .map(([key, value]) => `<${key}>${this.escapeXml(value)}</${key}>`)
      .join("\n      ");

    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://tempuri.org/">
      ${paramsXml}
    </${method}>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * فراخوانی متد SOAP وب‌سرویس ملی پیامک
   * @param method - نام متد
   * @param params - پارامترها
   * @returns رشته XML پاسخ
   */
  private async callSoapMethod(
    method: string,
    params: Record<string, string>,
  ): Promise<string> {
    const envelope = this.buildSoapEnvelope(method, params);

    try {
      const response = await axios.post(MELI_PAYAMAK_ENDPOINT, envelope, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: `http://tempuri.org/${method}`,
        },
        timeout: 30000, // تایم‌اوت ۳۰ ثانیه
      });

      return response.data as string;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === "ECONNABORTED") {
          throw new Error("تایم‌اوت: ارتباط با سرور ملی پیامک قطع شد");
        }
        if (!error.response) {
          throw new Error("خطای شبکه: اتصال به سرور ملی پیامک برقرار نشد");
        }
        throw new Error(
          `خطای سرور ملی پیامک: ${error.response.status} - ${error.response.statusText}`,
        );
      }
      throw error;
    }
  }

  /**
   * تجزیه پاسخ SOAP XML و تبدیل به آبجکت
   * @param xml - رشته XML دریافتی از سرور
   * @returns آبجکت تجزیه شده
   */
  private parseSoapResponse(xml: string): Record<string, any> {
    const result: Record<string, any> = {};

    try {
      // حذف فضاهای نام برای ساده‌سازی تجزیه
      const cleanXml = xml
        .replace(/xmlns[^"]*"[^"]*"/g, "")
        .replace(/<soap:/g, "<")
        .replace(/<\/soap:/g, "</")
        .replace(/<\w+:/g, "<")
        .replace(/<\/\w+:/g, "</");

      // استخراج بخش Body
      const bodyMatch = cleanXml.match(/<Body>([\s\S]*?)<\/Body>/i);
      if (!bodyMatch) {
        return { body: null, raw: xml };
      }

      const bodyContent = bodyMatch[1];

      // استخراج تمامی تگ‌ها و مقادیر
      result.body = this.extractTagValues(bodyContent);
      result.raw = xml;
    } catch {
      // در صورت خطای تجزیه، XML خام را برمی‌گردانیم
      result.body = null;
      result.raw = xml;
    }

    return result;
  }

  /**
   * استخراج نام و مقدار تگ‌ها از یک رشته XML
   * @param xml - رشته XML
   * @returns آبجکت شامل نام و مقدار تگ‌ها
   */
  private extractTagValues(xml: string): Record<string, any> {
    const result: Record<string, any> = {};
    const tagRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(xml)) !== null) {
      const tagName = match[1];
      const tagValue = match[2].trim();

      // اگر مقدار خودش حاوی تگ‌های تو در تو باشد
      const innerTags = tagValue.match(/<(\w+)>/g);
      if (innerTags && innerTags.length > 0) {
        result[tagName] = this.extractTagValues(tagValue);
      } else {
        // حذف CDATA در صورت وجود
        result[tagName] = tagValue
          .replace(/^<!\[CDATA\[/, "")
          .replace(/\]\]>$/, "")
          .trim();
      }
    }

    return result;
  }

  // ─────────────────────────────────────────
  // متدهای کمکی عمومی
  // ─────────────────────────────────────────

  /**
   * نرمال‌سازی شماره تلفن به فرمت استاندارد +98
   * پشتیبانی از فرمت‌های مختلف شماره تلفن:
   * - 09XXXXXXXXX
   * - 9XXXXXXXXX
   * - +989XXXXXXXXX
   * - 989XXXXXXXXX
   * - 00989XXXXXXXXX
   * @param phone - شماره تلفن ورودی
   * @returns شماره نرمال شده با پیشوند +98
   */
  formatPersianNumber(phone: string): string {
    if (!phone) return "";

    // حذف فاصله، خط تیره و پرانتز
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");

    // حذف پیشوند 0098
    if (cleaned.startsWith("0098")) {
      cleaned = cleaned.substring(4);
    }
    // تبدیل 09 به 9
    else if (cleaned.startsWith("09")) {
      cleaned = cleaned.substring(1);
    }
    // حذف +98
    else if (cleaned.startsWith("+98")) {
      cleaned = cleaned.substring(3);
    }
    // حذف 98 در ابتدا
    else if (cleaned.startsWith("98") && cleaned.length >= 12) {
      cleaned = cleaned.substring(2);
    }

    // اطمینان از شروع با 9
    if (!cleaned.startsWith("9")) {
      return phone; // در صورت ناشناخته بودن فرمت، همان را برمی‌گردانیم
    }

    return `+98${cleaned}`;
  }

  /**
   * بررسی آیا کد بازگشتی نشان‌دهنده خطا است
   * کدهای منفی و کدهای بزرگ‌تر از صفر خطا هستند
   * فقط 0 یا رشته عددی طولانی (شناسه پیام) موفق هستند
   * @param code - کد بازگشتی از API
   */
  private isErrorCode(code: string): boolean {
    const num = parseInt(code, 10);
    // شناسه پیام معمولاً عدد بزرگی است (مثل 1234567890)
    // کدهای خطا معمولاً اعداد کوچکی هستند (1 تا 32)
    if (isNaN(num)) return true;
    if (num === 0) return false;
    if (num > 0 && num <= 50) return true; // احتمالاً کد خطا
    return false; // احتمالاً شناسه پیام
  }

  /**
   * دریافت اطلاعات وضعیت تحویل بر اساس کد
   * @param statusCode - کد وضعیت
   * @returns اطلاعات وضعیت تحویل
   */
  private getDeliveryStatusInfo(statusCode: number): DeliveryStatus {
    const statusMap: Record<number, { delivered: boolean; text: string }> = {
      [-1]: { delivered: false, text: "خطا در بررسی وضعیت" },
      [0]: { delivered: false, text: "در صف ارسال" },
      [1]: { delivered: true, text: "رسیده به گوشی گیرنده" },
      [2]: { delivered: true, text: "رسیده به مخابرات" },
      [3]: { delivered: false, text: "ناموفق - خطای مخابراتی" },
      [4]: { delivered: false, text: "ناموفق - شماره گیرنده مسدود" },
      [5]: { delivered: false, text: "ناموفق - شماره گیرنده نامعتبر" },
      [6]: { delivered: false, text: "ناموفق - عدم موجودی" },
      [8]: { delivered: false, text: "ناموفق - خط فرستنده فعال نیست" },
      [9]: {
        delivered: false,
        text: "ناموفق - محدودیت ارسال",
      },
      [10]: { delivered: false, text: "ناموفق - متن نامعتبر" },
      [11]: { delivered: false, text: "ناموفق - گیرنده غیرفعال" },
      [13]: {
        delivered: false,
        text: "ناموفق - ارسال به خارج از کشور",
      },
      [14]: { delivered: false, text: "ناموفق - سرویس غیرفعال" },
      [16]: { delivered: false, text: "ناموفق - اعتبار کافی نیست" },
      [18]: { delivered: false, text: "ناموفق - محدودیت حجمی" },
      [100]: {
        delivered: false,
        text: "نامشخص - در انتظار نتیجه",
      },
    };

    const info = statusMap[statusCode] || {
      delivered: statusCode === 1 || statusCode === 2,
      text: `وضعیت نامشخص (کد ${statusCode})`,
    };

    return {
      delivered: info.delivered,
      status: statusCode,
      statusText: info.text,
    };
  }

  /**
   * محاسبه هزینه تقریبی پیامک
   * هر ۷۰ کاراکتر فارسی = ۱ پیامک
   * @param text - متن پیام
   * @param recipientCount - تعداد گیرندگان
   * @returns تعداد پیامک
   */
  private calculateCost(text: string, recipientCount: number): number {
    // هر ۷۰ کاراکتر = ۱ پیامک (استاندارد UCS-2 برای فارسی)
    const messageLength = text.length;
    const messagesPerRecipient = Math.ceil(messageLength / 70);
    return messagesPerRecipient * recipientCount;
  }

  /**
   * فرمت تاریخ برای ارسال به API
   * @param date - تاریخ مورد نظر
   * @returns رشته تاریخ در فرمت YYYY/MM/DD HH:MM
   */
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  /**
   * تقسیم آرایه به دسته‌های کوچک‌تر
   * @param array - آرایه ورودی
   * @param size - اندازه هر دسته
   * @returns آرایه‌ای از دسته‌ها
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * ایجاد تأخیر
   * @param ms - مدت زمان به میلی‌ثانیه
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * رفع خطر کاراکترهای خاص در XML
   * @param str - رشته ورودی
   * @returns رشته امن برای XML
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * مدیریت خطاها و تبدیل به فرمت یکسان
   * @param error - خطای دریافتی
   * @returns نتیجه ارسال با خطا
   */
  private handleServiceError(error: unknown): SendSMSResult {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          error: "تایم‌اوت: ارتباط با سرور ملی پیامک قطع شد",
        };
      }
      if (!error.response) {
        return {
          success: false,
          error:
            "خطای شبکه: اتصال به سرور ملی پیامک برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.",
        };
      }
      return {
        success: false,
        error: `خطای سرور: ${error.response.status}`,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "خطای ناشناخته در ارسال پیامک",
    };
  }

  /**
   * ثبت لاگ پیامک در دیتابیس
   * @param data - اطلاعات لاگ
   */
  private async logSms(data: {
    recipient: string;
    message: string;
    type: "otp" | "notification" | "marketing" | "welcome" | "custom";
    messageId?: string;
    status: "pending" | "sent" | "delivered" | "failed";
    cost?: number;
    sentBy?: string;
  }): Promise<void> {
    try {
      await SmsLog.create({
        recipient: data.recipient,
        sender: this.fromNumber,
        message: data.message,
        type: data.type,
        messageId: data.messageId || null,
        status: data.status,
        cost: data.cost || 0,
        sentBy: data.sentBy || null,
        provider: "meli_payamak",
      });
    } catch (logError) {
      // خطای ثبت لاگ نباید مانع ارسال شود
      console.error("خطا در ثبت لاگ پیامک:", logError);
    }
  }
}

// خروجی singleton pattern برای استفاده در سرور
let smsServiceInstance: SmsService | null = null;

/**
 * دریافت نمونه واحد از سرویس پیامک
 * @param config - تنظیمات سرویس (فقط در اولین فراخوانی)
 */
export function getSmsService(config?: SmsServiceConfig): SmsService {
  if (!smsServiceInstance && config) {
    smsServiceInstance = new SmsService(config);
  }
  if (!smsServiceInstance) {
    throw new Error(
      "سرویس پیامک مقداردهی نشده است. ابتدا تنظیمات را ارسال کنید.",
    );
  }
  return smsServiceInstance;
}

/**
 * بازنشانی نمونه سرویس (برای تست و تغییر تنظیمات)
 */
export function resetSmsService(): void {
  smsServiceInstance = null;
}

export default SmsService;
