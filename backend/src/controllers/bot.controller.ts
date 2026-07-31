// backend/src/controllers/bot.controller.ts
// ============================================================
// کنترلر بات — پشتیبانی از تلگرام، بله و آیتا
// ============================================================
import { Request, Response } from "express";
import { Ad, Category } from "../models";

// ─── تنظیمات بات (از .env بخواند) ───
interface BotConfig {
  token: string;
  enabled: boolean;
}

function getBotConfig(platform: string): BotConfig {
  const envKey =
    {
      telegram: "TELEGRAM_BOT_TOKEN",
      bale: "BALE_BOT_TOKEN",
      eitaa: "EITAA_BOT_TOKEN",
    }[platform] || "";

  return {
    token: process.env[envKey] || "",
    enabled: !!process.env[envKey],
  };
}

// ─── هندل وب‌هوک ───
export function handleWebhook(platform: string) {
  return async (req: Request, res: Response) => {
    try {
      const config = getBotConfig(platform);

      if (!config.enabled) {
        return res.status(503).json({
          success: false,
          message: `بات ${platform} فعال نیست. توکن را در .env تنظیم کنید.`,
        });
      }

      // بررسی وب‌هوک سکرت (امنیت)
      const secret = req.headers["x-webhook-secret"] as string;
      const expectedSecret =
        process.env[`${platform.toUpperCase()}_WEBHOOK_SECRET`];

      if (expectedSecret && secret !== expectedSecret) {
        return res.status(403).json({
          success: false,
          message: "وب‌هوک سکرت نامعتبر است",
        });
      }

      const body = req.body;

      // استخراج پیام و چت‌آیدی بر اساس پلتفرم
      const { chatId, text, firstName, lastName } = extractMessage(
        body,
        platform,
      );

      if (!chatId) {
        return res.json({ success: true, message: "چت‌آیدی یافت نشد" });
      }

      // پردازش دستورات
      let replyText = "";

      if (text === "/start" || text === "شروع") {
        replyText =
          `🏠 *به ربات ${process.env.SITE_NAME || "پلتفرم آگهی"} خوش آمدید!*\n\n` +
          `📋 *دستورات موجود:*\n` +
          `/search [کلمه] — جستجوی آگهی\n` +
          `/categories — دسته‌بندی‌ها\n` +
          `/ad [شناسه] — جزئیات آگهی\n` +
          `/subscribe [دسته‌بندی] — اشتراک اعلان\n` +
          `/help — راهنما\n\n` +
          `شما می‌توانید به جای دستورات، مستقیماً کلمه مورد نظر را تایپ کنید.`;
      } else if (text === "/help" || text === "راهنما") {
        replyText =
          `📖 *راهنمای ربات*\n\n` +
          `🔍 *جستجو:*\n` +
          `  /search آپارتمان تهران\n` +
          `  /search ویلا شمال\n\n` +
          `📂 *دسته‌بندی‌ها:*\n` +
          `  /categories\n\n` +
          `📄 *جزئیات آگهی:*\n` +
          `  /ad 12345\n\n` +
          `🔔 *اشتراک اعلان:*\n` +
          `  /subscribe آپارتمان\n` +
          `  /subscribe ویلا\n\n` +
          `🌐 وب‌سایت: ${process.env.FRONTEND_URL || "http://localhost:3000"}`;
      } else if (text === "/categories") {
        const categories = await Category.find({ isActive: true })
          .limit(20)
          .lean();
        if (categories.length === 0) {
          replyText = "❌ دسته‌بندی‌ای یافت نشد";
        } else {
          replyText =
            `📂 *دسته‌بندی‌ها (${categories.length} مورد):*\n\n` +
            categories
              // ✅ اصلاح: حذف c.title (فقط name و slug)
              .map((c: any, i: number) => `${i + 1}. ${c.name || c.slug}`)
              .join("\n");
        }
      } else if (text?.startsWith("/search ")) {
        const query = text.replace("/search ", "").trim();
        if (!query) {
          replyText =
            "❌ لطفاً کلمه جستجو را وارد کنید\nمثال: /search آپارتمان تهران";
        } else {
          const ads = await Ad.find({
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
            ],
            status: "active",
          })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("title price city district slug images")
            .lean();

          if (ads.length === 0) {
            replyText = `🔍 نتیجه‌ای برای "${query}" یافت نشد`;
          } else {
            const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            replyText =
              `🔍 *نتایج جستجو: "${query}"* (${ads.length} مورد)\n\n` +
              ads
                .map((ad: any, i: number) => {
                  const price = ad.price
                    ? `${Number(ad.price).toLocaleString("fa-IR")} تومان`
                    : "توافقی";
                  const location = [ad.city, ad.district]
                    .filter(Boolean)
                    .join("، ");
                  return `${i + 1}. ${ad.title}\n   💰 ${price}\n   📍 ${location || "نامشخص"}\n   🔗 ${baseUrl}/ads/${ad.slug || ad._id}`;
                })
                .join("\n\n");
          }
        }
      } else if (text?.startsWith("/ad ")) {
        const adId = text.replace("/ad ", "").trim();
        const ad = await Ad.findOne({
          $or: [{ _id: adId }, { slug: adId }],
          status: "active",
        }).lean();

        if (!ad) {
          replyText = "❌ آگهی یافت نشد یا حذف شده است";
        } else {
          const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
          const price = ad.price
            ? `${Number(ad.price).toLocaleString("fa-IR")} تومان`
            : "توافقی";
          const location = [ad.city, ad.district, ad.province]
            .filter(Boolean)
            .join("، ");

          replyText =
            `🏠 *${ad.title}*\n\n` +
            `💰 قیمت: ${price}\n` +
            `📍 موقعیت: ${location || "نامشخص"}\n` +
            `📅 تاریخ: ${new Date(ad.createdAt).toLocaleDateString("fa-IR")}\n` +
            (ad.description
              ? `\n📝 ${ad.description.substring(0, 200)}${ad.description.length > 200 ? "..." : ""}\n`
              : "") +
            `\n🔗 مشاهده کامل: ${baseUrl}/ads/${ad.slug || ad._id}`;
        }
      } else if (text?.startsWith("/subscribe ")) {
        const category = text.replace("/subscribe ", "").trim();
        replyText =
          `✅ اشتراک شما برای دسته‌بندی "${category}" ثبت شد.\n\n` +
          `⚠️ *توجه:* این قابلیت در نسخه بعدی فعال خواهد شد.\n` +
          `هر آگهی جدید در این دسته‌بندی برای شما ارسال خواهد شد.`;
      } else {
        // پیام معمولی — جستجوی خودکار
        if (text && text.length > 1) {
          const ads = await Ad.find({
            $or: [
              { title: { $regex: text, $options: "i" } },
              { description: { $regex: text, $options: "i" } },
            ],
            status: "active",
          })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("title price city slug")
            .lean();

          if (ads.length > 0) {
            const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            replyText =
              `🔍 *نتایج:*\n\n` +
              ads
                .map((ad: any) => {
                  const price = ad.price
                    ? `${Number(ad.price).toLocaleString("fa-IR")} تومان`
                    : "توافقی";
                  return `• ${ad.title}\n  💰 ${price} | 📍 ${ad.city || ""}\n  🔗 ${baseUrl}/ads/${ad.slug || ad._id}`;
                })
                .join("\n\n") +
              `\n\n_برای جستجوی دقیق‌تر: /search ${text}_`;
          } else {
            replyText =
              `🔍 نتیجه‌ای برای "${text}" یافت نشد.\n\n` +
              `دستورات:\n/help — راهنما\n/categories — دسته‌بندی‌ها`;
          }
        } else {
          replyText =
            `👋 سلام ${firstName || ""} ${lastName || ""}!\n\n` +
            `لطفاً دستور مورد نظر را وارد کنید:\n/help — راهنما`;
        }
      }

      // ارسال پاسخ به کاربر
      await sendMessage(platform, chatId, replyText);

      return res.json({ success: true });
    } catch (error) {
      console.error(`[Bot ${platform}] Webhook error:`, error);
      return res
        .status(500)
        .json({ success: false, message: "خطا در پردازش وب‌هوک" });
    }
  };
}

// ─── استخراج پیام بر اساس پلتفرم ───
function extractMessage(body: any, platform: string) {
  switch (platform) {
    case "telegram":
      return {
        chatId: body.message?.chat?.id,
        text: body.message?.text || "",
        firstName: body.message?.from?.first_name || "",
        lastName: body.message?.from?.last_name || "",
      };
    case "bale":
      return {
        chatId: body.message?.chat?.id || body.chat_id,
        text: body.message?.text || body.text || "",
        firstName: body.message?.from?.first_name || "",
        lastName: body.message?.from?.last_name || "",
      };
    case "eitaa":
      return {
        chatId: body.message?.chat?.id || body.chat_id,
        text: body.message?.text || body.text || "",
        firstName: body.message?.from?.first_name || "",
        lastName: body.message?.from?.last_name || "",
      };
    default:
      return { chatId: null, text: "", firstName: "", lastName: "" };
  }
}

// ─── ارسال پیام به پلتفرم ───
async function sendMessage(
  platform: string,
  chatId: number | string,
  text: string,
) {
  const tokens: Record<string, string> = {
    telegram: process.env.TELEGRAM_BOT_TOKEN || "",
    bale: process.env.BALE_BOT_TOKEN || "",
    eitaa: process.env.EITAA_BOT_TOKEN || "",
  };

  const apis: Record<string, string> = {
    telegram: `https://api.telegram.org/bot${tokens.telegram}/sendMessage`,
    bale: `https://tapi.bale.ai/bot${tokens.bale}/sendMessage`,
    eitaa: `https://api.eitaa.com/bot${tokens.eitaa}/sendMessage`,
  };

  const apiUrl = apis[platform];
  const token = tokens[platform];

  if (!token || !apiUrl) {
    console.error(`[Bot ${platform}] Token not configured`);
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Bot ${platform}] Send error:`, err);
    }
  } catch (error) {
    console.error(`[Bot ${platform}] Send failed:`, error);
  }
}

// ─── وضعیت بات ───
export async function getBotStatus(_req: Request, res: Response) {
  const platforms = ["telegram", "bale", "eitaa"] as const;
  const status = platforms.map((p) => {
    const config = getBotConfig(p);
    return {
      platform: p,
      enabled: config.enabled,
      configured: !!config.token,
    };
  });

  res.json({
    success: true,
    data: status,
  });
}

// ─── ارسال پیام تست ───
export async function sendTestMessage(req: Request, res: Response) {
  try {
    const {
      platform = "telegram",
      chatId,
      message = "تست موفقیت‌آمیز بود ✅",
    } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "chatId الزامی است",
      });
    }

    const config = getBotConfig(platform);
    if (!config.enabled) {
      return res.status(503).json({
        success: false,
        message: `بات ${platform} فعال نیست`,
      });
    }

    await sendMessage(platform, chatId, message);

    res.json({
      success: true,
      message: `پیام به ${platform} ارسال شد`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطا در ارسال پیام تست",
    });
  }
}

// ─── جستجوی آگهی (GET) ───
export async function searchAds(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "");
    const category = String(req.query.category || "");
    const city = String(req.query.city || "");
    const limit = String(req.query.limit || "5");

    const filter: any = { status: "active" };

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (city) filter.city = city;

    const ads = await Ad.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select("title price city district slug images createdAt")
      .lean();

    res.json({ success: true, data: ads, count: ads.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در جستجو" });
  }
}

// ─── دسته‌بندی‌ها (GET) ───
export async function getCategories(_req: Request, res: Response) {
  try {
    const categories = await Category.find({ isActive: true }).lean();
    res.json({ success: true, data: categories });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت دسته‌بندی‌ها" });
  }
}

// ─── جزئیات آگهی (GET) ───
export async function getAdDetail(req: Request, res: Response) {
  try {
    const id = String(req.params.id); // ✅ تبدیل به رشته

    const ad = await Ad.findOne({
      $or: [{ _id: id }, { slug: id }],
      status: "active",
    }).lean();

    if (!ad) {
      return res.status(404).json({ success: false, message: "آگهی یافت نشد" });
    }

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.json({
      success: true,
      data: {
        ...ad,
        url: `${baseUrl}/ads/${ad.slug || ad._id}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در دریافت آگهی" });
  }
}

// ─── اشتراک اعلان ───
export async function subscribeToNotifications(req: Request, res: Response) {
  try {
    const { platform, chatId, category } = req.body;

    if (!platform || !chatId) {
      return res.status(400).json({
        success: false,
        message: "platform و chatId الزامی هستند",
      });
    }

    res.json({
      success: true,
      message: `اشتراک برای ${category || "همه آگهی‌ها"} ثبت شد`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطا در ثبت اشتراک" });
  }
}
