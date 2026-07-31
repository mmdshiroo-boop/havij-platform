"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks: {
    telegram: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  adApprovalRequired: boolean;
  maxAdImages: number;
  defaultAdDuration: number;
  vipAdPrice: number;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  maintenanceMode: boolean;
  itemsPerPage: number;
  cacheDuration: number;
  pages: {
    aboutUs: string;
    aboutMission: string;
    aboutTeam: string;
    aboutSecurity: string;
    aboutSpeed: string;
    contactInfo: string;
    helpFaqs: string;
    privacyText: string;
    rulesText: string;
    supportFaqs: string;
    supportContactText: string;
  };
}

const defaultSettings: SiteSettings = {
  siteName: "پلتفرم آگهی هویج",
  siteDescription: "",
  siteLogo: "/log.png",
  favicon: "/favicon.ico",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  socialLinks: { telegram: "", instagram: "", twitter: "", linkedin: "" },
  adApprovalRequired: true,
  maxAdImages: 10,
  defaultAdDuration: 30,
  vipAdPrice: 50000,
  enableSmsNotifications: true,
  enableEmailNotifications: true,
  enablePushNotifications: true,
  maintenanceMode: false,
  itemsPerPage: 20,
  cacheDuration: 3600,
  pages: {
    aboutUs: "",
    aboutMission: "",
    aboutTeam: "",
    aboutSecurity: "",
    aboutSpeed: "",
    contactInfo: "",
    helpFaqs: "[]",
    privacyText: "",
    rulesText: "",
    supportFaqs: "[]",
    supportContactText: "",
  },
};

interface SettingsContextType {
  settings: SiteSettings;
  refreshSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  refreshSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const fetchSettings = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // ۵ ثانیه timeout

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/settings`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.data) {
        const newSettings = { ...defaultSettings, ...data.data };
        setSettings(newSettings);
        document.title = newSettings.siteName || "پلتفرم آگهی هویج";
        const faviconLink = document.querySelector(
          "link[rel='icon']",
        ) as HTMLLinkElement | null;
        if (faviconLink && newSettings.favicon) {
          faviconLink.href = newSettings.favicon;
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.warn("⏱️ Settings request timed out. Using defaults.");
      } else if (error.message === "Failed to fetch") {
        console.warn("🔌 Backend unreachable. Using default settings.");
      } else {
        console.error("Fetch settings failed:", error.message);
      }
      console.error("Fetch settings failed", error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleSettingsUpdate = () => fetchSettings();
    window.addEventListener("settings-updated", handleSettingsUpdate);
    const channel = new BroadcastChannel("settings_channel");
    channel.onmessage = (event) => {
      if (event.data?.type === "SETTINGS_UPDATED") fetchSettings();
    };
    return () => {
      window.removeEventListener("settings-updated", handleSettingsUpdate);
      channel.close();
    };
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{ settings, refreshSettings: fetchSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
