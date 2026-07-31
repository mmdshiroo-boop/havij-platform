"use client";

import { useEffect, useRef, useState, useCallback } from "react";

let NextImage: typeof import("next/image").default | null = null;
try {
  NextImage = require("next/image").default;
} catch {
  NextImage = null;
}

// ⚠️ ماژول watermark.utils وجود ندارد – توابع ساختگی جایگزین شدند
// در صورت نیاز به واترمارک واقعی، فایل اصلی را ایجاد و import کنید
const addWatermarkToImage = async (
  src: string,
  options?: any,
): Promise<Blob> => {
  // برای جلوگیری از خطا، تصویر اصلی را به‌عنوان blob برمی‌گردانیم
  const response = await fetch(src);
  return await response.blob();
};

const blobToDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export interface WatermarkedImageProps {
  src: string;
  alt: string;
  watermarkText?: string;
  className?: string;
  showOriginal?: boolean;
  isAdmin?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  lazy?: boolean;
  width?: number;
  height?: number;
  fill?: boolean;
  watermarkOptions?: Record<string, any>;
  style?: React.CSSProperties;
  priority?: boolean;
}

const watermarkCache = new Map<string, string>();

export default function WatermarkedImage({
  src,
  alt,
  watermarkText = "نام سایت",
  className,
  showOriginal = false,
  isAdmin = false,
  onLoad,
  onError,
  lazy = true,
  width,
  height,
  fill,
  watermarkOptions,
  style,
  priority = false,
}: WatermarkedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const isMountedRef = useRef(true);
  const abortRef = useRef(false);

  const cacheKey = `${src}|${watermarkText}|${watermarkOptions?.position ?? "tiled"}|${watermarkOptions?.opacity ?? 0.15}`;

  const processImage = useCallback(async () => {
    setState("loading");
    abortRef.current = false;
    try {
      const shouldShowOriginal = isAdmin || showOriginal;
      if (shouldShowOriginal) {
        if (isMountedRef.current && !abortRef.current) {
          setImageSrc(src);
          setState("loaded");
          onLoad?.();
        }
        return;
      }

      const cached = watermarkCache.get(cacheKey);
      if (cached) {
        if (isMountedRef.current && !abortRef.current) {
          setImageSrc(cached);
          setState("loaded");
          onLoad?.();
        }
        return;
      }

      const blob = await addWatermarkToImage(src, {
        text: watermarkText,
        ...watermarkOptions,
      });

      if (!isMountedRef.current || abortRef.current) return;
      const dataURL = await blobToDataURL(blob);
      if (!isMountedRef.current || abortRef.current) return;
      watermarkCache.set(cacheKey, dataURL);
      setImageSrc(dataURL);
      setState("loaded");
      onLoad?.();
    } catch (error) {
      console.warn("خطا در اعمال واترمارک، نمایش تصویر اصلی:", error);
      if (isMountedRef.current && !abortRef.current) {
        setImageSrc(src);
        setState("loaded");
        onError?.(
          error instanceof Error
            ? error
            : new Error("خطای ناشناخته در پردازش واترمارک"),
        );
      }
    }
  }, [
    src,
    watermarkText,
    watermarkOptions,
    cacheKey,
    isAdmin,
    showOriginal,
    onLoad,
    onError,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    processImage();
    return () => {
      isMountedRef.current = false;
      abortRef.current = true;
    };
  }, [processImage]);

  if (state === "loading" || imageSrc === null) {
    return (
      <div
        className={className}
        style={{
          backgroundColor: "#e5e7eb",
          backgroundImage:
            "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
          backgroundSize: "200% 100%",
          animation: "watermark-shimmer 1.5s ease-in-out infinite",
          borderRadius: "8px",
          width: width ?? "100%",
          height: height ?? "300px",
          minHeight: "200px",
          ...style,
        }}
      >
        <style>{`
          @keyframes watermark-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  const commonProps = {
    src: imageSrc,
    alt: alt,
    className: className,
    style: style,
    loading: (lazy ? "lazy" : "eager") as "lazy" | "eager",
    decoding: "async" as const,
  };

  if (NextImage) {
    return (
      <NextImage
        {...commonProps}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        onLoad={() => onLoad?.()}
        onError={() => {
          if (imageSrc !== src) setImageSrc(src);
        }}
        unoptimized={imageSrc.startsWith("data:")}
      />
    );
  }

  // تگ img معمولی – priority حذف شد
  return (
    <img
      {...commonProps}
      width={width}
      height={height}
      onLoad={() => onLoad?.()}
      onError={() => {
        if (imageSrc !== src) setImageSrc(src);
      }}
    />
  );
}
