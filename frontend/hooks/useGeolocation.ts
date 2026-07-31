import { useState } from "react";
import { toast } from "sonner";

interface GeoLocationResult {
  province: string;
  city: string;
  district: string;
}

export function useGeolocation() {
  const [detecting, setDetecting] = useState(false);

  const detectLocation = async (): Promise<GeoLocationResult | null> => {
    if (!navigator.geolocation) {
      toast.error("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند.");
      return null;
    }

    setDetecting(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let province = "";
          let city = "";
          let district = "";

          try {
            // ۱. دریافت استان از نشان (سریع)
            try {
              const neshanRes = await fetch(
                `https://api.neshan.org/v5/reverse?lat=${latitude}&lng=${longitude}`,
                {
                  headers: {
                    "Api-Key": "service.f3da8afc6b384ab5bda01e3375e1f3f5",
                  },
                }
              );
              const nData = await neshanRes.json();
              province = nData.state || "";
            } catch (e) {
              console.warn("Neshan failed, will rely on Nominatim proxy");
            }

            // ۲. دریافت شهر و منطقه از پروکسی خودمان (Nominatim)
            try {
              const proxyRes = await fetch(
                `/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`
              );
              if (proxyRes.ok) {
                const proxyData = await proxyRes.json();
                if (proxyData.success) {
                  province = province || proxyData.data.province;
                  city = proxyData.data.city || "";
                  district = proxyData.data.district || "";
                }
              }
            } catch (e) {
              console.warn("Proxy failed, using Neshan only");
            }

            // ۳. اگر پروکسی شهر نیاورد، سعی می‌کنیم از نشان استخراج کنیم
            if (!city) {
              try {
                const neshanRes = await fetch(
                  `https://api.neshan.org/v5/reverse?lat=${latitude}&lng=${longitude}`,
                  {
                    headers: {
                      "Api-Key": "service.f3da8afc6b384ab5bda01e3375e1f3f5",
                    },
                  }
                );
                const nData = await neshanRes.json();
                // اولویت: city، سپس municipality_zone بدون کلمه "دهستان/بخش"، سپس region
                const candidates = [
                  nData.city,
                  nData.municipality_zone,
                  nData.region,
                ].filter(Boolean);
                city = candidates.find(
                  (c) => !c.includes("دهستان") && !c.includes("بخش")
                ) || candidates[0] || "";
                district = nData.neighbourhood || nData.region || "";
              } catch (e) {
                // بی‌خیال
              }
            }

            // ۴. بررسی نهایی
            if (!province && !city) {
              toast.error("متأسفانه موقعیت دقیقی یافت نشد. لطفاً دستی وارد کنید.");
              resolve(null);
            } else {
              if (!city) {
                toast.warning("شهر شما یافت نشد. لطفاً آن را دستی تکمیل کنید.");
              }
              resolve({ province, city, district });
            }
          } catch (err) {
            console.error(err);
            toast.error("خطا در تشخیص موقعیت");
            resolve(null);
          } finally {
            setDetecting(false);
          }
        },
        (error) => {
          setDetecting(false);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("دسترسی به موقعیت مکانی توسط شما رد شد.");
          } else {
            toast.error("خطا در دریافت مختصات جغرافیایی.");
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  return { detecting, detectLocation };
}