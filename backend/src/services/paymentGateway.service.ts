import axios from "axios";
import { AppError } from "../utils/AppError";

interface PaymentRequest {
  amount: number;
  callbackUrl: string;
  description: string;
  metadata?: Record<string, any>;
}

export class PaymentGatewayService {
  private static MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || "";
  private static BASE_URL = "https://sandbox.zarinpal.com/pg/v4/payment";

  static async requestPayment(data: {
    amount: number;
    callbackUrl: string;
    description: string;
  }) {
    try {
      const res = await axios.post(`${this.BASE_URL}/request.json`, {
        merchant_id: this.MERCHANT_ID,
        amount: data.amount,
        callback_url: data.callbackUrl,
        description: data.description,
      });

      if (res.data.errors?.length > 0) {
        throw new Error(res.data.errors[0].message);
      }

      return {
        authority: res.data.data.authority,
        url: `https://sandbox.zarinpal.com/pg/StartPay/${res.data.data.authority}`,
      };
    } catch (err: any) {
      console.error("❌ ZarinPal Request Error:", err.message);
      throw new AppError("ارتباط با درگاه ناموفق بود", 503);
    }
  }

  static async verifyPayment(authority: string, amount: number) {
    try {
      const res = await axios.post(`${this.BASE_URL}/verify.json`, {
        merchant_id: this.MERCHANT_ID,
        authority,
        amount,
      });

      // کد 100 = موفق | 101 = قبلاً تایید شده
      if ([100, 101].includes(res.data.data?.code)) {
        return { success: true, refId: res.data.data.ref_id.toString() };
      }

      // Fallback برای تست در محیط توسعه
      if (process.env.NODE_ENV !== "production") {
        return { success: true, refId: `dev-${Date.now()}` };
      }

      return { success: false, refId: "" };
    } catch (err: any) {
      console.error("❌ ZarinPal Verify Error:", err.message);
      return { success: false, refId: "" };
    }
  }
}
