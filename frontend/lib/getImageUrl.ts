// lib/getImageUrl.ts
export function getImageUrl(imagePath?: string): string {
  if (!imagePath) return "/placeholder.jpg";

  if (imagePath.startsWith("http://localhost:5001")) {
    const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001";
    return imagePath.replace("http://localhost:5001", backendBase);
  }

  if (imagePath.startsWith("/uploads")) {
    const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5001";
    return backendBase + imagePath;
  }

  return imagePath;
}