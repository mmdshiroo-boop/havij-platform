// frontend/hooks/useLocationTracking.ts
"use client";

import { useEffect, useRef } from "react";
import { locationApi } from "@/services/api/locationMap.api";
import { useAuth } from "@/app/context/AuthContext";

export const useLocationTracking = () => {
  const { user, token } = useAuth();
  const lastSentRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const ipFallbackSentRef = useRef<boolean>(false); // برای جلوگیری از ارسال مکرر درخواست IP در صورت بلاک بودن

  useEffect(() => {
    // ۱. اگر کاربر لاگین نکرده باشد، هیچ درخواستی ارسال نمی‌شود
    if (!user || !token) return;

    if (!navigator.geolocation) {
      console.warn("مرورگر از موقعیت‌یابی پشتیبانی نمی‌کند");
      // اگر مرورگر پشتیبانی نکند، یکبار درخواست خالی می‌فرستیم تا سرور از IP استفاده کند
      if (!ipFallbackSentRef.current) {
        ipFallbackSentRef.current = true;
        locationApi.updateMyLocation({}).catch(console.error);
      }
      return;
    }

    // تابع ارسال موقعیت همراه با کنترل نرخ ارسال (Throttle)
    const handleLocationUpdate = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const now = Date.now();

      // جلوگیری از ارسال درخواست تکراری اگر کمتر از ۱۰ ثانیه گذشته یا مختصات تغییر نکرده باشد
      if (lastSentRef.current) {
        const timeDiff = now - lastSentRef.current.time;
        const isSameLat = Math.abs(lastSentRef.current.lat - latitude) < 0.0001;
        const isSameLng = Math.abs(lastSentRef.current.lng - longitude) < 0.0001;

        if (timeDiff < 10000 && isSameLat && isSameLng) {
          return;
        }
      }

      try {
        await locationApi.updateMyLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
        });
        lastSentRef.current = { lat: latitude, lng: longitude, time: now };
      } catch (error) {
        console.error("خطا در ارسال موقعیت:", error);
      }
    };

    // ۲. ثبت گوش‌به‌زنگ موقعیت مکانی
    const watchId = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      async (error) => {
        console.warn("خطا یا عدم دسترسی به موقعیت GPS:", error.message);
        
        // اگر کاربر دسترسی لوکیشن را مسدود کرد (Block)، درخواست خالی می‌فرستیم تا سرور از IP استفاده کند
        if (error.code === error.PERMISSION_DENIED && !ipFallbackSentRef.current) {
          ipFallbackSentRef.current = true;
          try {
            await locationApi.updateMyLocation({});
            console.log("موقعیت جایگزین بر اساس IP برای کاربر ثبت شد.");
          } catch (err) {
            console.error("خطا در ثبت لوکیشن بر اساس IP:", err);
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );

    // ۳. پاکسازی هنگام آن‌مانت
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      locationApi.setUserOffline().catch(console.error);
    };
  }, [user, token]);
};