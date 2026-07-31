/**
 * @file watermark.utils.ts
 * @description ابزارهای واترمارک برای پلتفرم املاک ایرانی
 * این ماژول شامل توابع افزودن واترمارک به تصاویر با استفاده از Canvas API است.
 */

// ─── انواع (Types) ────────────────────────────────────────────────────────────

/** نوع ورودی تصویر - می‌تواند فایل، آدرس URL یا عنصر HTMLImageElement باشد */
export type ImageInput = File | string | HTMLImageElement;

/** موقعیت قرارگیری واترمارک روی تصویر */
export type WatermarkPosition = "center" | "corner" | "tiled";

/** گزینه‌های ساخت واترمارک */
export interface WatermarkOptions {
  /** متن واترمارک - مثلاً "نام سایت" */
  text: string;

  /** شفافیت واترمارک بین ۰ تا ۱ - پیش‌فرض: ۰.۱۵ (۱۵٪) */
  opacity?: number;

  /** اندازه فونت به پیکسل - پیش‌فرض: ۲۴ */
  fontSize?: number;

  /** رنگ متن واترمارک - پیش‌فرض: rgba(255,255,255,0.5) */
  color?: string;

  /** موقعیت واترمارک - پیش‌فرض: tiled */
  position?: WatermarkPosition;

  /**
   * اندازه کاشی در حالت tiled (فقط موقعیت tiled)
   * فاصله افقی و عمودی بین هر متن واترمارک - پیش‌فرض: ۲۰۰
   */
  tileSize?: number;

  /** زاویه چرخش متن واترمارک بر حسب درجه - پیش‌فرض: -۳۰ */
  rotation?: number;

  /** نام فونت - پیش‌فرض: 'Tahoma' (مناسب برای متن فارسی) */
  fontFamily?: string;

  /** ضخامت فونت - پیش‌فرض: 'bold' */
  fontWeight?: string;
}

/** گزینه‌های پردازش دسته‌ای تصاویر */
export interface BatchWatermarkOptions extends WatermarkOptions {
  /** تابع بازخورد پیشرفت - درصد تکمیل را دریافت می‌کند (۰ تا ۱۰۰) */
  onProgress?: (percent: number, current: number, total: number) => void;
}

/** گزینه‌های داخلی ساخت بوم واترمارک */
interface CreateCanvasOptions {
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  position: WatermarkPosition;
  tileSize: number;
  rotation: number;
  fontFamily: string;
  fontWeight: string;
}

// ─── مقادیر پیش‌فرض ──────────────────────────────────────────────────────────

/** مقادیر پیش‌فرض برای گزینه‌های واترمارک */
const DEFAULT_OPTIONS: Omit<CreateCanvasOptions, "text"> = {
  opacity: 0.15,
  fontSize: 24,
  color: "rgba(255, 255, 255, 0.5)",
  position: "tiled",
  tileSize: 200,
  rotation: -30,
  fontFamily: "Tahoma",
  fontWeight: "bold",
};

// ─── توابع کمکی ──────────────────────────────────────────────────────────────

/**
 * تبدیل ورودی تصویر به HTMLImageElement
 * @param input - ورودی تصویر (فایل، URL یا HTMLImageElement)
 * @returns یک Promise که به HTMLImageElement حل می‌شود
 *
 * @example
 * ```ts
 * const img = await resolveImage("https://example.com/photo.jpg");
 * const imgFromFile = await resolveImage(fileInput.files[0]);
 * ```
 */
async function resolveImage(input: ImageInput): Promise<HTMLImageElement> {
  // اگر ورودی از قبل یک HTMLImageElement است، فقط بررسی می‌کنیم که لود شده باشد
  if (input instanceof HTMLImageElement) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      if (input.complete && input.naturalWidth > 0) {
        resolve(input);
      } else {
        input.onload = () => resolve(input);
        input.onerror = () =>
          reject(new Error("خطا در بارگذاری تصویر HTMLImageElement"));
      }
    });
  }

  // اگر ورودی یک آدرس URL (رشته) است
  if (typeof input === "string") {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // برای جلوگیری از مشکلات CORS
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error(`خطا در بارگذاری تصویر از آدرس: ${input}`));
      img.src = input;
    });
  }

  // اگر ورودی یک File است
  if (input instanceof File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(input);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url); // آزادسازی حافظه
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("خطا در بارگذاری فایل تصویر"));
      };
      img.src = url;
    });
  }

  throw new Error("نوع ورودی تصویر نامعتبر است. باید File، string یا HTMLImageElement باشد.");
}

/**
 * ادغام گزینه‌های کاربر با مقادیر پیش‌فرض
 * @param options - گزینه‌های ارائه‌شده توسط کاربر
 * @returns گزینه‌های نهایی با مقادیر پیش‌فرض برای فیلدهای خالی
 */
function mergeOptions(options: WatermarkOptions): CreateCanvasOptions {
  return {
    text: options.text,
    opacity: options.opacity ?? DEFAULT_OPTIONS.opacity,
    fontSize: options.fontSize ?? DEFAULT_OPTIONS.fontSize,
    color: options.color ?? DEFAULT_OPTIONS.color,
    position: options.position ?? DEFAULT_OPTIONS.position,
    tileSize: options.tileSize ?? DEFAULT_OPTIONS.tileSize,
    rotation: options.rotation ?? DEFAULT_OPTIONS.rotation,
    fontFamily: options.fontFamily ?? DEFAULT_OPTIONS.fontFamily,
    fontWeight: options.fontWeight ?? DEFAULT_OPTIONS.fontWeight,
  };
}

// ─── توابع اصلی ──────────────────────────────────────────────────────────────

/**
 * ایجاد بوم (Canvas) واترمارک با پارامترهای مشخص‌شده
 *
 * این تابع یک بوم شفاف با همان ابعاد تصویر اصلی ایجاد کرده و
 * متن واترمارک را با الگوی مشخص‌شده روی آن رسم می‌کند.
 *
 * @param width - عرض بوم به پیکسل
 * @param height - ارتفاع بوم به پیکسل
 * @param options - گزینه‌های واترمارک شامل متن، شفافیت، اندازه فونت و...
 * @returns بوم (Canvas) حاوی واترمارک
 *
 * @example
 * ```ts
 * // ایجاد واترمارک موزاییکی برای تصویر 800x600
 * const canvas = createWatermarkCanvas(800, 600, {
 *   text: "نام سایت",
 *   position: "tiled",
 *   opacity: 0.15,
 * });
 * ```
 */
export function createWatermarkCanvas(
  width: number,
  height: number,
  options: WatermarkOptions
): HTMLCanvasElement {
  const opts = mergeOptions(options);

  // ایجاد بوم شفاف با ابعاد تصویر اصلی
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("مرورگر از Canvas API پشتیبانی نمی‌کند.");
  }

  // تنظیم شفافیت کلی بوم واترمارک
  ctx.globalAlpha = opts.opacity;

  // تنظیم فونت فارسی
  ctx.font = `${opts.fontWeight} ${opts.fontSize}px "${opts.fontFamily}", sans-serif`;
  ctx.fillStyle = opts.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  switch (opts.position) {
    case "tiled":
      drawTiledWatermark(ctx, width, height, opts);
      break;
    case "corner":
      drawCornerWatermark(ctx, width, height, opts);
      break;
    case "center":
      drawCenterWatermark(ctx, width, height, opts);
      break;
  }

  return canvas;
}

/**
 * رسم واترمارک به صورت موزاییکی (tiled) روی کل تصویر
 * متن‌ها در یک شبکه منظم با زاویه مشخص تکرار می‌شوند
 * مشابه رویکرد سایت‌های املاک برای محافظت از تصاویر
 *
 * @param ctx - contexte بوم
 * @param width - عرض تصویر
 * @param height - ارتفاع تصویر
 * @param opts - گزینه‌های واترمارک
 */
function drawTiledWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: CreateCanvasOptions
): void {
  const tileSize = opts.tileSize;
  // برای پوشش کامل تصویر هنگام چرخش، ناحیه بزرگ‌تر را محاسبه می‌کنیم
  // با زاویه -۳۰ درجه، گوشه‌ها ممکن است پوشش داده نشوند
  const diagonal = Math.sqrt(width * width + height * height);
  const startX = -diagonal / 2;
  const startY = -diagonal / 2;
  const endX = diagonal + width / 2;
  const endY = diagonal + height / 2;

  // تبدیل زاویه از درجه به رادیان
  const angleRad = (opts.rotation * Math.PI) / 180;

  // ذخیره وضعیت فعلی بوم
  ctx.save();

  // انتقال نقطه مبدأ به مرکز تصویر برای چرخش
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angleRad);

  // رسم متن واترمارک در شبکه موزاییکی
  for (let y = startY; y < endY; y += tileSize) {
    for (let x = startX; x < endX; x += tileSize) {
      ctx.fillText(opts.text, x, y);
    }
  }

  // بازگرداندن وضعیت بوم
  ctx.restore();
}

/**
 * رسم واترمارک در گوشه پایین-راست تصویر
 *
 * @param ctx - contexte بوم
 * @param width - عرض تصویر
 * @param height - ارتفاع تصویر
 * @param opts - گزینه‌های واترمارک
 */
function drawCornerWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: CreateCanvasOptions
): void {
  const padding = 20;
  const angleRad = (opts.rotation * Math.PI) / 180;

  ctx.save();

  // انتقال به گوشه پایین-راست
  ctx.translate(width - padding - 80, height - padding - 15);
  ctx.rotate(angleRad);

  // رسم متن با سایه برای خوانایی بهتر
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillText(opts.text, 0, 0);

  ctx.restore();
}

/**
 * رسم یک واترمارک بزرگ در مرکز تصویر
 *
 * @param ctx - contexte بوم
 * @param width - عرض تصویر
 * @param height - ارتفاع تصویر
 * @param opts - گزینه‌های واترمارک
 */
function drawCenterWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: CreateCanvasOptions
): void {
  const angleRad = (opts.rotation * Math.PI) / 180;
  // در حالت center، اندازه فونت بزرگ‌تر
  const centerFontSize = opts.fontSize * 2.5;

  ctx.save();

  // تنظیم فونت بزرگ‌تر برای حالت مرکزی
  ctx.font = `${opts.fontWeight} ${centerFontSize}px "${opts.fontFamily}", sans-serif`;

  // انتقال به مرکز تصویر
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angleRad);

  // رسم متن با سایه
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillText(opts.text, 0, 0);

  ctx.restore();
}

/**
 * افزودن واترمارک به یک تصویر
 *
 * این تابع تصویر ورودی را گرفته و واترمارک مشخص‌شده را روی آن اعمال می‌کند.
 * نتیجه نهایی به صورت Blob برمی‌گردد که می‌تواند برای آپلود یا نمایش استفاده شود.
 *
 * @param input - تصویر ورودی (فایل، آدرس URL یا HTMLImageElement)
 * @param options - گزینه‌های واترمارک
 * @returns Promise<Blob> - تصویر واترمارک‌شده به صورت Blob
 *
 * @example
 * ```ts
 * // افزودن واترمارک به یک فایل
 * const blob = await addWatermarkToImage(file, {
 *   text: "مشاوران املاک نمونه",
 *   opacity: 0.2,
 *   position: "tiled",
 * });
 *
 * // افزودن واترمارک به یک URL
 * const blob = await addWatermarkToImage("https://example.com/house.jpg", {
 *   text: "نام سایت",
 * });
 * ```
 */
export async function addWatermarkToImage(
  input: ImageInput,
  options: WatermarkOptions
): Promise<Blob> {
  // بارگذاری تصویر
  const img = await resolveImage(input);

  // ایجاد بوم اصلی با ابعاد تصویر
  const mainCanvas = document.createElement("canvas");
  mainCanvas.width = img.naturalWidth || img.width;
  mainCanvas.height = img.naturalHeight || img.height;

  const ctx = mainCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("مرورگر از Canvas API پشتیبانی نمی‌کند.");
  }

  // رسم تصویر اصلی روی بوم
  ctx.drawImage(img, 0, 0);

  // ایجاد بوم واترمارک
  const watermarkCanvas = createWatermarkCanvas(
    mainCanvas.width,
    mainCanvas.height,
    options
  );

  // ترکیب واترمارک با تصویر اصلی
  ctx.drawImage(watermarkCanvas, 0, 0);

  // تبدیل بوم نهایی به Blob
  return new Promise<Blob>((resolve, reject) => {
    mainCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("خطا در تبدیل بوم به Blob"));
        }
      },
      "image/jpeg",
      0.92 // کیفیت ۹۲٪ برای حفظ کیفیت تصاویر املاک
    );
  });
}

/**
 * افزودن واترمارک به چندین تصویر به صورت دسته‌ای
 *
 * این تابع لیستی از فایل‌های تصویری را دریافت کرده و به هر کدام واترمارک اضافه می‌کند.
 * پیشرفت پردازش از طریق تابع بازخورد قابل پیگیری است.
 *
 * @param files - آرایه‌ای از فایل‌های تصویری
 * @param options - گزینه‌های واترمارک (شامل onProgress)
 * @returns Promise<File[]> - آرایه‌ای از فایل‌های واترمارک‌شده
 *
 * @example
 * ```ts
 * const watermarkedFiles = await addWatermarkToImages(
 *   Array.from(fileInput.files),
 *   {
 *     text: "مشاوران املاک نمونه",
 *     onProgress: (percent, current, total) => {
 *       console.log(`${percent}% - ${current} از ${total}`);
 *     },
 *   }
 * );
 * ```
 */
export async function addWatermarkToImages(
  files: File[],
  options: BatchWatermarkOptions
): Promise<File[]> {
  const { onProgress, ...watermarkOptions } = options;
  const total = files.length;
  const result: File[] = [];

  for (let i = 0; i < total; i++) {
    const file = files[i];

    try {
      // افزودن واترمارک به هر فایل
      const watermarkedBlob = await addWatermarkToImage(file, watermarkOptions);

      // ساخت فایل جدید از Blob واترمارک‌شده با حفظ نام و نوع اصلی
      const watermarkedFile = new File(
        [watermarkedBlob],
        `watermarked_${file.name}`,
        {
          type: file.type || "image/jpeg",
          lastModified: Date.now(),
        }
      );

      result.push(watermarkedFile);
    } catch (error) {
      // در صورت خطا، فایل اصلی را بدون تغییر اضافه می‌کنیم
      console.warn(
        `خطا در افزودن واترمارک به فایل "${file.name}":`,
        error
      );
      result.push(file);
    }

    // گزارش پیشرفت
    if (onProgress) {
      const percent = Math.round(((i + 1) / total) * 100);
      onProgress(percent, i + 1, total);
    }
  }

  return result;
}

/**
 * حذف واترمارک از تصویر (جعلی)
 *
 * ⚠️ **هشدار مهم:** این تابع یک جای‌خالی (placeholder) است و قابلیت حذف واقعی
 * واترمارک را ندارد. حذف واترمارک از تصاویر از نظر فنی بسیار پیچیده است و
 * معمولاً نیازمند شبکه‌های عصبی پیشرفته و پردازش تصویر تخصصی می‌باشد.
 *
 * همچنین، حذف واترمارک ممکن است نقض قوانین کپی‌رایت و مالکیت معنوی باشد.
 * این پلتفرم از حقوق مالکیت تصاویر املاک حمایت می‌کند.
 *
 * @param imageData - داده تصویر ورودی
 * @returns همان داده تصویر بدون هیچ تغییری
 *
 * @example
 * ```ts
 * // این تابع هیچ تغییری روی تصویر ایجاد نمی‌کند
 * const result = stripWatermark(imageBlob);
 * // result === imageBlob (بدون تغییر)
 * ```
 */
export function stripWatermark(imageData: Blob | File): Blob {
  // ─── توجه ───────────────────────────────────────────────────────────────
  // حذف واترمارک پشتیبانی نمی‌شود.
  // دلایل:
  //  ۱. واترمارک‌ها به صورت همپوشانی (overlay) اضافه می‌شوند و حذف آن‌ها
  //     بدون آسیب رساندن به تصویر اصلی غیرممکن است.
  //  ۲. حذف واترمارک نقض حقوق مالکیت معنوی صاحب تصویر است.
  //  ۳. سایت‌های املاک برای محافظت از تصاویر ملک از واترمارک استفاده می‌کنند
  //     و حذف آن‌ها خلاف اخلاق حرفه‌ای است.
  // ─────────────────────────────────────────────────────────────────────────

  console.warn(
    "⚠️ تابع stripWatermark پشتیبانی نمی‌شود. " +
      "حذف واترمارک از تصاویر امکان‌پذیر نیست و نقض حقوق مالکیت معنوی محسوب می‌شود."
  );

  // بازگرداندن تصویر بدون هیچ تغییری
  return imageData;
}

/**
 * تبدیل Blob بهDataURL برای استفاده در img src
 * @param blob - Blob تصویر
 * @returns Promise<string> - آدرس data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("خطا در تبدیل Blob به DataURL"));
    reader.readAsDataURL(blob);
  });
}

/**
 * دریافت ابعاد یک تصویر بدون بارگذاری کامل آن
 * @param input - ورودی تصویر
 * @returns Promise<{width: number, height: number}> - ابعاد تصویر
 */
export async function getImageDimensions(
  input: ImageInput
): Promise<{ width: number; height: number }> {
  const img = await resolveImage(input);
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  };
}