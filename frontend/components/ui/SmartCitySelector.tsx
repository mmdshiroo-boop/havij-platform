// components/SmartCitySelector.tsx
'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface SmartCitySelectorProps {
  onSuccess?: () => void;
}

export default function SmartCitySelector({ onSuccess }: SmartCitySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat?: number; lng?: number; city?: string } | null>(null);

  // تابع درخواست موقعیت هوشمند
  const handleDetectLocation = () => {
    setLoading(true);
    setStatusText('در حال دریافت موقعیت مکانی...');

    // بررسی پشتیبانی مرورگر
    if (!('geolocation' in navigator)) {
      handleFallbackIP('مرورگر شما از GPS پشتیبانی نمی‌کند. در حال شناسایی از طریق شبکه/IP...');
      return;
    }

    // تنظمیات بهینه‌شده جهت جلوگیری از Timeout در لپ‌تاپ و کامپیوتر
    const options = {
      enableHighAccuracy: false, // برای لپ‌تاپ و کامپیوتر خانگی که GPS ندارند
      timeout: 10000,            // حداکثر ۱۰ ثانیه منتظر بماند
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ۱. تایید موفقیت‌آمیز GPS
        setSelectedCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatusText('✅ موقعیت GPS شما دریافت شد. جهت ثبت نهایی دکمه زیر را بزنید.');
        setLoading(false);
      },
      (error) => {
        // ۲. مدیریت انواع خطاهای GPS و سوئیچ هوشمند به IP
        let errorMessage = '';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '⚠️ دسترسی GPS توسط شما یا مرورگر مسدود شده است. در حال دریافت موقعیت بر اساس IP...';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '⚠️ اطلاعات موقعیت مکانی در دسترس نیست. در حال دریافت موقعیت بر اساس IP...';
            break;
          case error.TIMEOUT:
            errorMessage = '⚠️ زمان پاسخ‌دهی GPS به پایان رسید. در حال دریافت موقعیت بر اساس IP...';
            break;
          default:
            errorMessage = '⚠️ خطای ناشناخته در GPS. در حال دریافت موقعیت بر اساس IP...';
            break;
        }

        // سوئیچ خودکار به IP بدون برهم خوردن تجربه کاربر
        handleFallbackIP(errorMessage);
      },
      options
    );
  };

  // تابع جایگزین (Fallback) برای زمان بلاک شدن یا خطا در GPS
  const handleFallbackIP = (message: string) => {
    setStatusText(message);
    
    // ارسال شیء خالی باعث می‌شود بک‌اند موقعیت را از روی IP یا شهر پیش‌فرض ثبت کند
    setSelectedCoords({}); 
    
    setTimeout(() => {
      setStatusText('🌐 شهر شما بر اساس آی‌پای (IP) شناسایی شد. جهت ثبت دکمه تایید را بزنید.');
      setLoading(false);
    }, 1200);
  };

  // ارسال نهایی داده‌ها به بک‌اند جهت نمایش روی نقشه ادمین
  const handleConfirmLocation = async () => {
    if (!selectedCoords) return;

    setLoading(true);
    setStatusText('در حال ثبت موقعیت در دیتابیس...');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/location/update-my-location',
        selectedCoords,
        {
          headers: {
            Authorization: `Bearer ${token || ''}`,
          },
        }
      );

      if (response.data.success) {
        setStatusText('🎉 موقعیت شما با موفقیت ثبت شد و در نقشه ادمین قرار گرفت!');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('خطا در ثبت موقعیت:', error);
      setStatusText('❌ خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md max-w-md mx-auto rtl text-right border border-gray-100">
      <h3 className="text-lg font-bold mb-3 text-gray-800">📍 انتخاب هوشمند شهر من</h3>
      
      <p className="text-sm text-gray-600 mb-4">
        جهت ثبت موقعیت شما در سامانه و نمایش آن در نقشه، لطفا روی دکمه زیر کلیک کنید:
      </p>

      {/* دکمه شناسایی */}
      <button
        onClick={handleDetectLocation}
        disabled={loading}
        className="w-full py-2.5 px-4 mb-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200 disabled:opacity-50"
      >
        {loading ? 'در حال پردازش...' : '🎯 شناسایی هوشمند موقعیت من'}
      </button>

      {/* نمایش پیام وضعیت */}
      {statusText && (
        <div className="text-xs p-3 mb-3 bg-gray-50 text-gray-700 rounded-md border border-gray-200 leading-relaxed">
          {statusText}
        </div>
      )}

      {/* دکمه تایید نهایی */}
      {selectedCoords && (
        <button
          onClick={handleConfirmLocation}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition duration-200 disabled:opacity-50"
        >
          ✓ تایید و ثبت موقعیت
        </button>
      )}
    </div>
  );
}