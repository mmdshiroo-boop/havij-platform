import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../temp"));
  },
  filename: (req, file, cb) => {
    cb(null, `bulk-${Date.now()}.zip`);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (
    file.mimetype === "application/zip" ||
    file.originalname.endsWith(".zip")
  ) {
    cb(null, true);
  } else {
    cb(new Error("فقط فایل‌های ZIP مجاز هستند"));
  }
};

export const uploadZip = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
