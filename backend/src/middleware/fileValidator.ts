import { fileTypeFromBuffer } from "file-type";
import { Request, Response, NextFunction } from "express";

const allowedMimes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
];

export const validateFileType = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const file = req.file as Express.Multer.File | undefined; // برای multer
    // اگر از express-fileupload استفاده می‌کنید:
    // const file = (req as any).files?.file;

    if (!file) {
      return next(); // بدون فایل، رد شو
    }

    // اگر file.buffer وجود دارد (در صورت useTempFiles=false یا memoryStorage)
    const buffer = file.buffer;
    if (!buffer) {
      // اگر بافر نبود (مثلاً multer diskStorage)، فایل را از دیسک بخوانیم
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(
        file.destination || "uploads/chat",
        file.filename,
      );
      if (!fs.existsSync(filePath)) {
        return res.status(400).json({ message: "فایل یافت نشد" });
      }
      const diskBuffer = fs.readFileSync(filePath);
      const type = await fileTypeFromBuffer(diskBuffer);
      if (!type || !allowedMimes.includes(type.mime)) {
        // پاک کردن فایل مخرب
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: "نوع فایل مجاز نیست" });
      }
      return next();
    }

    // اگر buffer داریم
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !allowedMimes.includes(type.mime)) {
      // در صورت multer diskStorage باید فایل را پاک کنیم
      if (file.destination && file.filename) {
        const fs = require("fs");
        const path = require("path");
        const filePath = path.join(file.destination, file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      return res.status(400).json({ message: "نوع فایل مجاز نیست" });
    }

    next();
  } catch (error) {
    console.error("File validation error:", error);
    res.status(500).json({ message: "خطا در اعتبارسنجی فایل" });
  }
};
