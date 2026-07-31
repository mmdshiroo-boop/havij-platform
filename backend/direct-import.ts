import * as fs from "fs";
import * as path from "path";
import mongoose from "mongoose";
import { importScrapedPropertyService } from "./src/controllers/property.controller.ts";
// اتصال به دیتابیس مونگو (آدرس دیتابیس خود را جایگزین کنید)
const MONGO_URI: string =
  process.env.MONGO_URI || "mongodb://localhost:27017/divar-clone";
// آدرس پوشه‌ای که فایل‌های JSON شیپور در آن قرار دارند
const DATA_DIR: string = path.join(process.cwd(), "scraped_data");
async function runImporter(): Promise<void> {
  try {
    console.log("⏳ ۱. در حال تلاش برای اتصال به دیتابیس...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ ۲. اتصال به دیتابیس با موفقیت برقرار شد.");

    console.log(`⏳ ۳. بررسی وجود پوشه در مسیر: ${DATA_DIR}`);
    if (!fs.existsSync(DATA_DIR)) {
      console.error(`❌ پوشه دیتای آگهی‌ها یافت نشد:\n${DATA_DIR}`);
      process.exit(1);
    }

    console.log("⏳ ۴. در حال خواندن لیست فایل‌های JSON...");
    const files: string[] = fs
      .readdirSync(DATA_DIR)
      .filter((file) => file.endsWith(".json"));
    console.log(`📊 ۵. تعداد ${files.length} فایل پیدا شد. شروع پردازش...`);

    let successCount: number = 0;
    let failCount: number = 0;

    for (const file of files) {
      console.log(`🔄 در حال پردازش فایل: ${file}`);
      try {
        const filePath: string = path.join(DATA_DIR, file);
        const rawData: string = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(rawData);

        // لاگ قبل از ورود به تابع کنترلر
        console.log(`   -> ارسال به دیتابیس...`);
        const result = await importScrapedPropertyService(jsonData);
        console.log(`   -> پاسخ دیتابیس دریافت شد.`);

        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (fileError: any) {
        failCount++;
        console.error(`❌ خطا در فایل ${file}:`, fileError.message);
      }
    }

    console.log(
      `\n🎉 عملیات تمام شد. موفق: ${successCount} | ناموفق: ${failCount}`,
    );
  } catch (error) {
    console.error("❌ خطای کلی:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 دیتابیس قطع شد.");
    process.exit(0);
  }
}

runImporter();
