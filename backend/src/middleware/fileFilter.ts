import { Request, Response, NextFunction } from "express";

export const validateFileType = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
    console.error(
      "❌ [Upload Validation Error]: 'file' key missing in multipart request.",
    );
    return res.status(400).json({
      success: false,
      message:
        "فایلی ارسال نشده است یا نام فیلد ارسالی صحیح نیست (نام فیلد باید file باشد).",
    });
  }

  const file = Array.isArray(req.files.file)
    ? req.files.file[0]
    : req.files.file;

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "text/plain",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: `فرمت فایل ارسالی (${file.mimetype}) مجاز نیست.`,
    });
  }

  req.uploadedFile = file;
  next();
};

declare global {
  namespace Express {
    interface Request {
      uploadedFile?: any;
      user?: any; // برای جلوگیری از ارور تایپ‌اسکریپت در req.user
    }
  }
}
