"use client";

import React, { useState } from "react";
import {
  Printer,
  MapPin,
  Phone,
  Calendar,
  Home,
  Layers,
  Maximize,
  DoorOpen,
  Clock,
  Building2,
  Tag,
} from "lucide-react";

interface AdLocation {
  province: string;
  city: string;
  district: string;
  address: string;
}

interface AdFeatures {
  area: number;
  rooms: number;
  floor: number;
  buildingAge: number;
  yearBuilt: number;
}

export interface Ad {
  title: string;
  description: string;
  price: number;
  priceType: "rent" | "sale";
  images: string[];
  location: AdLocation;
  features: AdFeatures;
  amenities: string[];
  contactPhone: string;
  contactName: string;
  createdAt: string;
  adType: string;
  propertyType: string;
}

interface AdPrintLayoutProps {
  ad: Ad;
  siteName?: string;
}

const toPersianDigits = (num: number | string): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const formatPrice = (price: number, priceType: "rent" | "sale"): string => {
  if (priceType === "rent") {
    if (price >= 1_000_000_000) {
      const billion = price / 1_000_000_000;
      return `${toPersianDigits(billion % 1 === 0 ? billion : billion.toFixed(1))} میلیارد تومان ماهانه`;
    }
    if (price >= 1_000_000) {
      const million = price / 1_000_000;
      return `${toPersianDigits(million % 1 === 0 ? million : million.toFixed(1))} میلیون تومان ماهانه`;
    }
    return `${toPersianDigits(price)} تومان ماهانه`;
  }
  if (price >= 1_000_000_000) {
    const billion = price / 1_000_000_000;
    return `${toPersianDigits(billion % 1 === 0 ? billion : billion.toFixed(1))} میلیارد تومان`;
  }
  if (price >= 1_000_000) {
    const million = price / 1_000_000;
    return `${toPersianDigits(million % 1 === 0 ? million : million.toFixed(1))} میلیون تومان`;
  }
  return `${toPersianDigits(price)} تومان`;
};

const getAdTypeLabel = (adType: string): string => {
  const labels: Record<string, string> = {
    sale: "فروش",
    rent: "اجاره",
    mortgage: "رهن و اجاره",
    preSale: "پیش‌فروش",
    exchange: "معاوضه",
  };
  return labels[adType] || adType;
};

const getPropertyTypeLabel = (propertyType: string): string => {
  const labels: Record<string, string> = {
    apartment: "آپارتمان",
    villa: "ویلا",
    house: "خانه",
    land: "زمین",
    commercial: "مجتمع تجاری",
    office: "دفتر کار",
    suite: "سوییت",
    garden: "باغ",
    villaApartment: "ویلایی آپارتمان",
    oldHouse: "خانه کلنگی",
    workshop: "کارگاه",
    warehouse: "انبار",
    duplex: "دوبلکس",
    penthouse: "پنت‌هاوس",
    flat: "مستغلات",
  };
  return labels[propertyType] || propertyType;
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return toPersianDigits(
      date.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
  } catch {
    return dateStr;
  }
};

const formatBuildingAge = (age: number): string => {
  if (age === 0) return "نوساز";
  return `${toPersianDigits(age)} سال`;
};

const AdPrintLayout: React.FC<AdPrintLayoutProps> = ({
  ad,
  siteName = "نام سایت",
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body > *:not(.ad-print-wrapper) {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 8mm;
            size: A4;
          }
          html,
          body {
            direction: rtl;
            font-family: Tahoma, "Segoe UI", Arial, sans-serif;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ad-print-wrapper {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .print-header {
            display: flex !important;
            flex-direction: row-reverse;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 6mm;
            border-bottom: 1px solid #333 !important;
            margin-bottom: 6mm;
          }
          .print-header h1 {
            font-size: 14pt !important;
            font-weight: bold !important;
            margin: 0 !important;
            color: #000 !important;
          }
          .print-main-image {
            width: 100% !important;
            max-height: 280px !important;
            object-fit: cover !important;
            border-radius: 4px !important;
            border: 1px solid #ccc !important;
            margin-bottom: 6mm !important;
          }
          .print-title {
            font-size: 16pt !important;
            font-weight: bold !important;
            color: #000 !important;
            margin: 0 0 2mm 0 !important;
          }
          .print-price {
            font-size: 14pt !important;
            font-weight: bold !important;
            color: #1a56db !important;
            margin: 0 0 4mm 0 !important;
          }
          .print-location {
            font-size: 9pt !important;
            color: #333 !important;
            margin-bottom: 4mm !important;
          }
          .print-features-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 3mm !important;
            margin-bottom: 4mm !important;
            padding: 4mm !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            background: #fafafa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-feature-item {
            text-align: center !important;
          }
          .print-feature-value {
            font-size: 11pt !important;
            font-weight: bold !important;
            color: #000 !important;
            display: block !important;
          }
          .print-feature-label {
            font-size: 8pt !important;
            color: #555 !important;
            display: block !important;
          }
          .print-amenities {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 2mm !important;
            margin-bottom: 4mm !important;
          }
          .print-amenity-badge {
            font-size: 8pt !important;
            padding: 1mm 3mm !important;
            border: 1px solid #999 !important;
            border-radius: 3px !important;
            color: #333 !important;
            background: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-description {
            font-size: 9pt !important;
            line-height: 1.6 !important;
            color: #222 !important;
            margin-bottom: 4mm !important;
            text-align: justify !important;
            white-space: pre-wrap !important;
          }
          .print-contact {
            display: flex !important;
            flex-direction: row-reverse;
            align-items: center !important;
            gap: 4mm !important;
            padding: 4mm !important;
            border: 2px solid #1a56db !important;
            border-radius: 6px !important;
            margin-bottom: 4mm !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-contact-phone {
            font-size: 16pt !important;
            font-weight: bold !important;
            color: #1a56db !important;
            direction: ltr !important;
            text-align: right !important;
          }
          .print-contact-name {
            font-size: 10pt !important;
            color: #333 !important;
          }
          .print-footer {
            display: flex !important;
            flex-direction: row-reverse;
            align-items: center !important;
            justify-content: space-between !important;
            padding-top: 4mm !important;
            border-top: 1px solid #999 !important;
            font-size: 7pt !important;
            color: #777 !important;
          }
          .print-qr-placeholder {
            width: 50px !important;
            height: 50px !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 6pt !important;
            color: #999 !important;
            background: #f5f5f5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-ad-type-badge {
            font-size: 9pt !important;
            padding: 1mm 4mm !important;
            border-radius: 3px !important;
            display: inline-block !important;
            margin-left: 2mm !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ad-print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="no-print mb-6 flex justify-start">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
        >
          <Printer className="h-5 w-5" />
          <span className="font-bold">چاپ آگهی</span>
        </button>
      </div>

      <div className="ad-print-wrapper ad-print-page-break" dir="rtl">
        <div className="print-header">
          <h1>چاپ آگهی</h1>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white"
              style={{ fontFamily: "Tahoma, sans-serif" }}
            >
              لوگو
            </div>
            <span
              className="text-sm font-semibold text-gray-700"
              style={{ fontFamily: "Tahoma, sans-serif" }}
            >
              {siteName}
            </span>
          </div>
        </div>

        {ad.images && ad.images.length > 0 && (
          <div className="relative mb-5 overflow-hidden rounded-xl">
            {!isImageLoaded && (
              <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100">
                <Building2 className="h-12 w-12 text-gray-300" />
              </div>
            )}
            <img
              src={ad.images[0]}
              alt={ad.title}
              className={`print-main-image transition-opacity duration-300 ${
                isImageLoaded ? "opacity-100" : "opacity-0 absolute"
              }`}
              style={{ width: "100%", height: "260px", objectFit: "cover" }}
              onLoad={() => setIsImageLoaded(true)}
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <span className="print-ad-type-badge rounded-md bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow">
                {getAdTypeLabel(ad.adType)}
              </span>
              <span className="print-ad-type-badge rounded-md bg-green-600 px-3 py-1 text-xs font-bold text-white shadow">
                {getPropertyTypeLabel(ad.propertyType)}
              </span>
            </div>
          </div>
        )}

        <div className="mb-2 flex items-start justify-between">
          <h2
            className="print-title text-2xl font-extrabold leading-tight text-gray-900"
            style={{ fontFamily: "Tahoma, sans-serif" }}
          >
            {ad.title}
          </h2>
        </div>

        <div className="mb-4">
          <p
            className="print-price text-xl font-extrabold text-blue-600"
            style={{ fontFamily: "Tahoma, sans-serif" }}
          >
            {formatPrice(ad.price, ad.priceType)}
          </p>
        </div>

        <div className="print-location mb-4 flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4 flex-shrink-0 text-red-500" />
          <span style={{ fontFamily: "Tahoma, sans-serif" }}>
            {ad.location.province}، {ad.location.city}، {ad.location.district}
            {ad.location.address ? ` — ${ad.location.address}` : ""}
          </span>
        </div>

        <div
          className="print-features-grid mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          <div className="print-feature-item rounded-lg bg-white p-3 text-center shadow-sm">
            <Maximize className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <span className="print-feature-value text-lg font-bold text-gray-800">
              {toPersianDigits(ad.features.area)}
            </span>
            <span className="print-feature-label text-xs text-gray-500">
              متر مربع
            </span>
          </div>

          <div className="print-feature-item rounded-lg bg-white p-3 text-center shadow-sm">
            <DoorOpen className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <span className="print-feature-value text-lg font-bold text-gray-800">
              {toPersianDigits(ad.features.rooms)}
            </span>
            <span className="print-feature-label text-xs text-gray-500">
              اتاق خواب
            </span>
          </div>

          <div className="print-feature-item rounded-lg bg-white p-3 text-center shadow-sm">
            <Layers className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <span className="print-feature-value text-lg font-bold text-gray-800">
              {toPersianDigits(ad.features.floor)}
            </span>
            <span className="print-feature-label text-xs text-gray-500">
              طبقه
            </span>
          </div>

          <div className="print-feature-item rounded-lg bg-white p-3 text-center shadow-sm">
            <Calendar className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <span className="print-feature-value text-lg font-bold text-gray-800">
              {toPersianDigits(ad.features.yearBuilt)}
            </span>
            <span className="print-feature-label text-xs text-gray-500">
              سال ساخت
            </span>
          </div>

          <div className="print-feature-item rounded-lg bg-white p-3 text-center shadow-sm">
            <Clock className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <span className="print-feature-value text-lg font-bold text-gray-800">
              {formatBuildingAge(ad.features.buildingAge)}
            </span>
            <span className="print-feature-label text-xs text-gray-500">
              عمر بنا
            </span>
          </div>

          <div className="print-feature-item rounded-lg bg-white p-3 text-center shadow-sm">
            <Home className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <span className="print-feature-value text-lg font-bold text-gray-800">
              {getPropertyTypeLabel(ad.propertyType)}
            </span>
            <span className="print-feature-label text-xs text-gray-500">
              نوع ملک
            </span>
          </div>
        </div>

        {ad.amenities && ad.amenities.length > 0 && (
          <div className="print-amenities mb-5 flex flex-wrap gap-2">
            {ad.amenities.map((amenity, index) => (
              <span
                key={index}
                className="print-amenity-badge rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                style={{ fontFamily: "Tahoma, sans-serif" }}
              >
                <Tag className="ml-1 inline h-3 w-3" />
                {amenity}
              </span>
            ))}
          </div>
        )}

        {ad.description && (
          <div className="mb-5 rounded-lg border border-gray-100 bg-white p-4">
            <p
              className="print-description text-sm leading-7 text-gray-700"
              style={{
                fontFamily: "Tahoma, sans-serif",
                whiteSpace: "pre-wrap",
                textAlign: "justify" as const,
              }}
            >
              {ad.description}
            </p>
          </div>
        )}

        <div className="print-contact mb-5 flex items-center gap-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Phone className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p
              className="print-contact-name text-sm text-gray-600"
              style={{ fontFamily: "Tahoma, sans-serif" }}
            >
              {ad.contactName}
            </p>
            <p
              className="print-contact-phone text-xl font-extrabold text-blue-700"
              style={{
                fontFamily: "Tahoma, sans-serif",
                direction: "ltr",
                textAlign: "right",
              }}
            >
              {toPersianDigits(ad.contactPhone)}
            </p>
          </div>
        </div>

        <div className="print-footer flex items-center justify-between border-t border-gray-200 pt-3">
          <div className="flex items-center gap-4">
            <div className="print-qr-placeholder flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-gray-50">
              <span className="text-[7px] text-gray-400">QR</span>
            </div>
            <div>
              <p
                className="text-xs text-gray-400"
                style={{ fontFamily: "Tahoma, sans-serif" }}
              >
                چاپ شده از {siteName}
              </p>
              <p
                className="text-[10px] text-gray-300"
                style={{ fontFamily: "Tahoma, sans-serif" }}
              >
                {formatDate(ad.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdPrintLayout;
