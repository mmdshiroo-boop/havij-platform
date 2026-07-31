/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.sheypoor.com" },
      { protocol: "https", hostname: "**.sheypoor.com" },
      { protocol: "https", hostname: "**.divarcdn.com" }, // اگه از عکس‌های دیوار هم استفاده می‌کنی
    ],
  },
};

module.exports = nextConfig;
