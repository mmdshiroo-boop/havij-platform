"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Printer,
  X,
  MapPin,
  Phone,
  Maximize,
  DoorOpen,
  CheckSquare,
  Square,
  ChevronLeft,
  Loader2,
  Building2,
  User,
  Check,
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

interface AdsBulkPrintProps {
  ads: Ad[];
  agentName?: string;
  agentPhone?: string;
  siteName?: string;
}

const toPersianDigits = (num: number | string): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

const formatPrice = (price: number, priceType: "rent" | "sale"): string => {
  const suffix = priceType === "rent" ? " ماهانه" : "";
  if (price >= 1_000_000_000) {
    const value = price / 1_000_000_000;
    return `${toPersianDigits(value % 1 === 0 ? value : value.toFixed(1))} میلیارد تومان${suffix}`;
  }
  if (price >= 1_000_000) {
    const value = price / 1_000_000;
    return `${toPersianDigits(value % 1 === 0 ? value : value.toFixed(1))} میلیون تومان${suffix}`;
  }
  return `${toPersianDigits(price)} تومان${suffix}`;
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
    commercial: "تجاری",
    office: "دفتر",
    suite: "سوییت",
    garden: "باغ",
    duplex: "دوبلکس",
    penthouse: "پنت‌هاوس",
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

const AdsBulkPrint: React.FC<AdsBulkPrintProps> = ({
  ads,
  agentName,
  agentPhone,
  siteName = "نام سایت",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(ads.map((_, i) => i)),
  );
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const isAllSelected = selectedIndices.size === ads.length;
  const selectedAds = ads.filter((_, index) => selectedIndices.has(index));

  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(ads.map((_, i) => i)));
    }
  }, [isAllSelected, ads]);

  const handleOpenModal = useCallback(() => {
    setIsLoading(true);
    setIsModalOpen(true);
    ads.forEach((ad) => {
      ad.images?.forEach((img) => {
        const image = new Image();
        image.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(img));
        };
        image.onerror = () => {
          setLoadedImages((prev) => new Set(prev).add(img));
        };
        image.src = img;
      });
    });
  }, [ads]);

  useEffect(() => {
    if (!isModalOpen) return;
    const totalImages = ads.reduce(
      (acc, ad) => acc + (ad.images?.length || 0),
      0,
    );
    if (totalImages === 0) {
      setIsLoading(false);
      return;
    }
    if (loadedImages.size >= totalImages) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, loadedImages, ads]);

  const handlePrint = () => {
    window.print();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsLoading(false);
  };

  const adPages: Ad[][] = [];
  for (let i = 0; i < selectedAds.length; i += 2) {
    adPages.push(selectedAds.slice(i, i + 2));
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body > *:not(.bulk-print-modal-overlay) {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: #000 !important;
            overflow: visible !important;
          }
          html,
          body {
            direction: rtl;
            font-family: Tahoma, "Segoe UI", Arial, sans-serif;
          }
          .no-print,
          .bulk-print-screen-controls {
            display: none !important;
          }
          @page {
            margin: 8mm 6mm;
            size: A4 portrait;
          }
          .bulk-print-modal-overlay {
            position: static !important;
            background: white !important;
            overflow: visible !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .bulk-print-modal-content {
            position: static !important;
            background: white !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
          }
          .bulk-print-page {
            page-break-after: always !important;
            break-after: page !important;
            padding-bottom: 4mm !important;
          }
          .bulk-print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .bulk-print-agent-header {
            display: flex !important;
            flex-direction: row-reverse;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 3mm 4mm !important;
            border-bottom: 1.5pt solid #333 !important;
            margin-bottom: 4mm !important;
            background: none !important;
          }
          .bulk-print-agent-header .agent-info-text {
            font-size: 9pt !important;
            color: #000 !important;
          }
          .bulk-print-agent-header .site-label {
            font-size: 8pt !important;
            color: #666 !important;
          }
          .bulk-print-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 4mm !important;
          }
          .bulk-print-card {
            border: 0.5pt solid #aaa !important;
            border-radius: 4px !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bulk-print-card-image {
            width: 100% !important;
            height: 140px !important;
            object-fit: cover !important;
            border-bottom: 0.5pt solid #aaa !important;
          }
          .bulk-print-card-body {
            padding: 3mm !important;
          }
          .bulk-print-card-title {
            font-size: 9pt !important;
            font-weight: bold !important;
            color: #000 !important;
            margin: 0 0 1.5mm 0 !important;
            line-height: 1.4 !important;
            max-height: 25pt !important;
            overflow: hidden !important;
          }
          .bulk-print-card-price {
            font-size: 8.5pt !important;
            font-weight: bold !important;
            color: #1a56db !important;
            margin: 0 0 2mm 0 !important;
          }
          .bulk-print-card-specs {
            font-size: 7.5pt !important;
            color: #444 !important;
            margin: 0 0 1.5mm 0 !important;
          }
          .bulk-print-card-location {
            font-size: 7pt !important;
            color: #777 !important;
            margin: 0 0 2mm 0 !important;
          }
          .bulk-print-card-contact {
            display: flex !important;
            flex-direction: row-reverse;
            align-items: center !important;
            gap: 2mm !important;
            padding-top: 2mm !important;
            border-top: 0.5pt solid #ddd !important;
          }
          .bulk-print-card-phone {
            font-size: 8pt !important;
            font-weight: bold !important;
            color: #000 !important;
            direction: ltr !important;
            text-align: right !important;
          }
          .bulk-print-page-footer {
            display: flex !important;
            flex-direction: row-reverse;
            align-items: center !important;
            justify-content: space-between !important;
            padding-top: 2mm !important;
            border-top: 0.5pt solid #999 !important;
            margin-top: 3mm !important;
            font-size: 6.5pt !important;
            color: #888 !important;
          }
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <button
          onClick={handleOpenModal}
          disabled={ads.length === 0}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Printer className="h-4 w-4" />
          <span>چاپ {toPersianDigits(selectedIndices.size)} آگهی</span>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {isModalOpen && (
        <div
          className="bulk-print-modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
          dir="rtl"
        >
          <div
            className="bulk-print-modal-content relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
            style={{ fontFamily: "Tahoma, sans-serif" }}
          >
            <div className="bulk-print-screen-controls sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-gray-800">
                    پیش‌نمایش چاپ آگهی‌ها
                  </h2>
                  <p className="text-xs text-gray-400">
                    {toPersianDigits(selectedAds.length)} آگهی —{" "}
                    {toPersianDigits(adPages.length)} صفحه
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {isAllSelected ? (
                    <>
                      <Square className="h-3.5 w-3.5" />
                      لغو انتخاب
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-3.5 w-3.5" />
                      انتخاب همه
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={selectedAds.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Printer className="h-4 w-4" />
                  چاپ
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">
                  در حال بارگذاری تصاویر...
                </p>
              </div>
            )}

            {!isLoading && (
              <div className="bulk-print-screen-controls border-b border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                  {ads.map((ad, index) => (
                    <button
                      key={index}
                      onClick={() => toggleSelection(index)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                        selectedIndices.has(index)
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {selectedIndices.has(index) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3 rounded-sm border border-current" />
                      )}
                      <span className="max-w-[120px] truncate">{ad.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && selectedAds.length > 0 && (
              <div className="p-6" id="bulk-print-content">
                {adPages.map((pageAds, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="bulk-print-page mb-6 last:mb-0"
                  >
                    <div className="bulk-print-agent-header mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {agentName || "مشاور املاک"}
                          </p>
                          {agentPhone && (
                            <p
                              className="text-xs text-gray-500"
                              style={{ direction: "ltr", textAlign: "right" }}
                            >
                              {toPersianDigits(agentPhone)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-600">
                          {siteName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          صفحه {toPersianDigits(pageIndex + 1)} از{" "}
                          {toPersianDigits(adPages.length)}
                        </p>
                      </div>
                    </div>

                    <div className="bulk-print-grid grid grid-cols-2 gap-4">
                      {pageAds.map((ad, cardIndex) => (
                        <div
                          key={`${pageIndex}-${cardIndex}`}
                          className="bulk-print-card overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                        >
                          <div className="relative h-36 overflow-hidden bg-gray-100">
                            {ad.images && ad.images.length > 0 ? (
                              <img
                                src={ad.images[0]}
                                alt={ad.title}
                                className="bulk-print-card-image h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Building2 className="h-10 w-10 text-gray-300" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                              <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                {getAdTypeLabel(ad.adType)}
                              </span>
                            </div>
                          </div>
                          <div className="bulk-print-card-body p-3">
                            <h3 className="bulk-print-card-title mb-1 text-sm font-bold leading-snug text-gray-900">
                              {ad.title}
                            </h3>
                            <p className="bulk-print-card-price mb-2 text-sm font-extrabold text-blue-600">
                              {formatPrice(ad.price, ad.priceType)}
                            </p>
                            <div className="bulk-print-card-specs mb-1.5 flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Maximize className="h-3 w-3" />
                                {toPersianDigits(ad.features.area)} م
                              </span>
                              <span className="flex items-center gap-1">
                                <DoorOpen className="h-3 w-3" />
                                {toPersianDigits(ad.features.rooms)} خوابه
                              </span>
                              <span className="text-gray-400">
                                {getPropertyTypeLabel(ad.propertyType)}
                              </span>
                            </div>
                            <p className="bulk-print-card-location mb-2 flex items-center gap-1 text-[11px] text-gray-400">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {ad.location.city}، {ad.location.district}
                              </span>
                            </p>
                            <div className="bulk-print-card-contact flex items-center gap-2 border-t border-gray-100 pt-2">
                              <Phone className="h-3 w-3 flex-shrink-0 text-green-600" />
                              <span
                                className="bulk-print-card-phone text-xs font-bold text-gray-800"
                                style={{ direction: "ltr", textAlign: "right" }}
                              >
                                {toPersianDigits(ad.contactPhone)}
                              </span>
                              <span className="mr-auto text-[10px] text-gray-400">
                                {ad.contactName}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {pageAds.length === 1 && (
                        <div className="hidden rounded-xl border border-dashed border-gray-200" />
                      )}
                    </div>

                    <div className="bulk-print-page-footer mt-4 flex items-center justify-between border-t border-gray-200 pt-2">
                      <p className="text-[10px] text-gray-400">
                        چاپ شده از {siteName}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(new Date().toISOString())}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && selectedAds.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
                <p className="text-sm">هیچ آگهی‌ای انتخاب نشده است</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdsBulkPrint;
