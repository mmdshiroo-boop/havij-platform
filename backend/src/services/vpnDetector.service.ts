import axios from "axios";
import { Request } from "express";

interface IPInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  proxy: boolean;
  hosting: boolean;
}

class VPNDetectorService {
  private cache: Map<string, { data: IPInfo; timestamp: number }> = new Map();
  private CACHE_DURATION = 1000 * 60 * 60;

  async getIPInfo(ip: string): Promise<IPInfo | null> {
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    try {
      const { data } = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 3000,
      });
      const info: IPInfo = {
        ip: data.ip,
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        isp: data.org,
        proxy: data.proxy || false,
        hosting: data.hosting || false,
      };
      this.cache.set(ip, { data: info, timestamp: Date.now() });
      return info;
    } catch (error) {
      console.warn(`⚠️ VPN detection failed for IP ${ip}:`, error.message);
      return null;
    }
  }

  getClientIP(req: Request): string {
    // ✅ استخراج IP واقعی از هدر x-forwarded-for
    const forwarded = (req.headers["x-forwarded-for"] as string) || "";
    return forwarded.split(",")[0]?.trim() || req.socket.remoteAddress?.replace("::ffff:", "") || "unknown";
  }

  async isVPN(ip: string): Promise<boolean> {
    const info = await this.getIPInfo(ip);
    return info ? info.proxy || info.hosting : false;
  }

  async isIranIP(ip: string): Promise<boolean> {
    const info = await this.getIPInfo(ip);
    return info?.countryCode === "IR";
  }

  async isAllowedCountry(ip: string, allowedCountries: string[]): Promise<boolean> {
    const info = await this.getIPInfo(ip);
    return info ? allowedCountries.includes(info.countryCode) : false;
  }
}

export const vpnDetectorService = new VPNDetectorService();