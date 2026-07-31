import { z } from "zod";

export const initiatePurchaseSchema = z.object({
  planSlug: z.string().min(1, "شناسه پلن الزامی است"),
});

export const verifyPaymentSchema = z.object({
  authority: z.string().min(1, "شناسه پرداخت الزامی است"),
});
