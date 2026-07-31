"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Calculator,
  TrendingUp,
  Scale,
  Printer,
  ChevronDown,
  Info,
} from "lucide-react";

/* ================================================================
   انواع و رابط‌ها
   ================================================================ */

/** ردیف جدول بازپرداخت */
interface ScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

/** ورودی‌های وام برای مقایسه */
interface LoanCompare {
  amount: number;
  duration: number;
  rate: number;
}

/* ================================================================
   توابع کمکی
   ================================================================ */

/**
 * تبدیل اعداد لاتین به فارسی
 * مثال: 1234 → ۱۲۳۴
 */
function toPersianDigits(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

/**
 * فرمت‌دهی مبلغ به صورت خوانا
 * مثال: 1500000000 → "۱ میلیارد و ۵۰۰ میلیون تومان"
 * مثال: 500000000  → "۵۰۰ میلیون تومان"
 */
function formatToman(amount: number): string {
  if (amount <= 0) return "۰ تومان";

  const billion = Math.floor(amount / 1_000_000_000);
  const million = Math.floor((amount % 1_000_000_000) / 1_000_000);

  if (billion > 0 && million > 0) {
    return `${toPersianDigits(billion)} میلیارد و ${toPersianDigits(million)} میلیون تومان`;
  } else if (billion > 0) {
    return `${toPersianDigits(billion)} میلیارد تومان`;
  } else if (million > 0) {
    return `${toPersianDigits(million)} میلیون تومان`;
  } else {
    return `${toPersianDigits(Math.round(amount).toLocaleString("fa-IR"))} تومان`;
  }
}

/**
 * محاسبه قسط ماهانه بر اساس فرمول استاندارد amortization
 * M = P × [r(1+r)^n] / [(1+r)^n − 1]
 *
 * @param principal  مبلغ وام
 * @param annualRate نرخ سود سالانه (درصد)
 * @param years      مدت بازپرداخت به سال
 * @returns قسط ماهانه (رند شده به بالا)
 */
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number,
): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate === 0) return Math.ceil(principal / (years * 12));

  const r = annualRate / 100 / 12; // نرخ ماهانه
  const n = years * 12; // تعداد کل اقساط
  const factor = Math.pow(1 + r, n);
  const payment = (principal * r * factor) / (factor - 1);

  return Math.ceil(payment); // رند به بالا — استاندارد بانکی ایران
}

/**
 * تولید جدول بازپرداخت کامل (آمورتیزیشن)
 * هر ردیف شامل: شماره ماه، قسط کل، بخش اصل، بخش سود، مانده باقی‌مانده
 *
 * @param principal  مبلغ وام
 * @param annualRate نرخ سود سالانه (درصد)
 * @param years      مدت بازپرداخت به سال
 * @returns آرایه‌ای از ردیف‌های جدول بازپرداخت
 */
function generateSchedule(
  principal: number,
  annualRate: number,
  years: number,
): ScheduleRow[] {
  if (principal <= 0 || years <= 0) return [];

  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const r = annualRate / 100 / 12; // نرخ ماهانه
  const totalMonths = years * 12;
  const schedule: ScheduleRow[] = [];
  let remaining = principal;

  for (let month = 1; month <= totalMonths; month++) {
    // سود این ماه = مانده قبلی × نرخ ماهانه
    const interestPart = remaining * r;

    // بخش اصل = قسط ماهانه − سود
    let principalPart = monthlyPayment - interestPart;

    // ماه آخر: تنظیم برای رساندن مانده دقیقاً به صفر
    if (principalPart > remaining) {
      principalPart = remaining;
    }

    const actualPayment = principalPart + interestPart;
    remaining = Math.max(0, remaining - principalPart);

    schedule.push({
      month,
      payment: Math.round(actualPayment),
      principal: Math.round(principalPart),
      interest: Math.round(interestPart),
      remaining: Math.round(remaining),
    });
  }

  return schedule;
}

/* ================================================================
   کامپوننت اصلی: ماشین‌حساب وام و محاسبه اقساط
   ================================================================ */

export default function MortgageCalculator() {
  /* ----- تب فعال ----- */
  const [activeTab, setActiveTab] = useState<number>(0);

  /* ----- تب ۱: ماشین حساب وام ----- */
  const [loanAmount, setLoanAmount] = useState<number>(500_000_000);
  const [duration, setDuration] = useState<number>(10);
  const [interestRate, setInterestRate] = useState<number>(23);
  const [loanType, setLoanType] = useState<string>("housing");
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [showAllSchedule, setShowAllSchedule] = useState<boolean>(false);

  /* ----- تب ۲: مقایسه وام‌ها ----- */
  const [loans, setLoans] = useState<LoanCompare[]>([
    { amount: 500_000_000, duration: 10, rate: 23 },
    { amount: 800_000_000, duration: 15, rate: 18 },
    { amount: 1_000_000_000, duration: 20, rate: 22.5 },
  ]);

  /* ----- تب ۳: محاسبه توان بازپرداخت ----- */
  const [monthlyIncome, setMonthlyIncome] = useState<number>(30_000_000);
  const [fixedExpenses, setFixedExpenses] = useState<number>(10_000_000);
  const [affordRate, setAffordRate] = useState<number>(23);
  const [affordDuration, setAffordDuration] = useState<number>(10);

  /* ===== محاسبات تب ۱ ===== */
  const loanResults = useMemo(() => {
    const monthlyPayment = calculateMonthlyPayment(
      loanAmount,
      interestRate,
      duration,
    );
    const schedule = generateSchedule(loanAmount, interestRate, duration);
    const totalRepayment = schedule.reduce((sum, row) => sum + row.payment, 0);
    const totalInterest = totalRepayment - loanAmount;

    return { monthlyPayment, totalInterest, totalRepayment, schedule };
  }, [loanAmount, interestRate, duration]);

  /* ===== محاسبات تب ۲ ===== */
  const compareResults = useMemo(() => {
    return loans.map((loan) => {
      const monthlyPayment = calculateMonthlyPayment(
        loan.amount,
        loan.rate,
        loan.duration,
      );
      const schedule = generateSchedule(loan.amount, loan.rate, loan.duration);
      const totalRepayment = schedule.reduce(
        (sum, row) => sum + row.payment,
        0,
      );
      const totalInterest = totalRepayment - loan.amount;
      return { monthlyPayment, totalInterest, totalRepayment };
    });
  }, [loans]);

  /** پیدا کردن ارزان‌ترین وام (کمترین مجموع بازپرداخت) */
  const cheapestIndex = useMemo(() => {
    if (compareResults.length === 0) return -1;
    let minTotal = Infinity;
    let minIdx = 0;
    compareResults.forEach((r, i) => {
      if (r.totalRepayment < minTotal) {
        minTotal = r.totalRepayment;
        minIdx = i;
      }
    });
    return minIdx;
  }, [compareResults]);

  /* ===== محاسبات تب ۳ ===== */
  const affordResults = useMemo(() => {
    const available = monthlyIncome - fixedExpenses;
    if (available <= 0 || affordDuration <= 0) {
      return { maxLoan: 0, monthlyPayment: 0 };
    }
    // حالت نرخ سود صفر
    if (affordRate === 0) {
      const maxLoan = available * affordDuration * 12;
      return { maxLoan, monthlyPayment: available };
    }

    // فرمول ارزش فعلی آنوئیتی: PV = PMT × (1 − (1+r)^−n) / r
    const r = affordRate / 100 / 12;
    const n = affordDuration * 12;
    const maxLoan = available * ((1 - Math.pow(1 + r, -n)) / r);
    return { maxLoan: Math.floor(maxLoan), monthlyPayment: available };
  }, [monthlyIncome, fixedExpenses, affordRate, affordDuration]);

  /* ===== توابع کنترل‌کننده ===== */

  /** انجام محاسبه و نمایش نتایج */
  const handleCalculate = useCallback(() => {
    setIsCalculated(true);
    setShowAllSchedule(false);
  }, []);

  /** چاپ جدول بازپرداخت — باز کردن پنجره جدید و چاپ */
  const handlePrint = useCallback(() => {
    const schedule = loanResults.schedule;
    const rows = schedule
      .map(
        (row) => `<tr>
          <td>${toPersianDigits(row.month)}</td>
          <td>${row.payment.toLocaleString("fa-IR")}</td>
          <td>${row.principal.toLocaleString("fa-IR")}</td>
          <td>${row.interest.toLocaleString("fa-IR")}</td>
          <td>${row.remaining.toLocaleString("fa-IR")}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>جدول بازپرداخت وام</title>
  <style>
    @page { size: landscape; margin: 10mm; }
    body { font-family: Tahoma, Arial, sans-serif; direction: rtl; padding: 20px; }
    h2 { color: #ea580c; margin-bottom: 5px; }
    .info { margin-bottom: 15px; color: #374151; }
    .info p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { background-color: #f97316; color: white; padding: 8px 6px; font-size: 12px; }
    td { border: 1px solid #e5e7eb; padding: 6px; text-align: center; }
    tr:nth-child(even) { background-color: #fff7ed; }
  </style>
</head>
<body>
  <h2>جدول بازپرداخت وام</h2>
  <div class="info">
    <p><strong>مبلغ وام:</strong> ${formatToman(loanAmount)}</p>
    <p><strong>مدت بازپرداخت:</strong> ${toPersianDigits(duration)} سال</p>
    <p><strong>نرخ سود:</strong> ${toPersianDigits(interestRate)}٪</p>
    <p><strong>قسط ماهانه:</strong> ${loanResults.monthlyPayment.toLocaleString("fa-IR")} تومان</p>
    <p><strong>مجموع بازپرداخت:</strong> ${formatToman(loanResults.totalRepayment)}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>ماه</th>
        <th>قسط</th>
        <th>اصل</th>
        <th>سود</th>
        <th>مانده</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // منتظر بارگذاری کامل قبل از چاپ
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [loanResults, loanAmount, duration, interestRate]);

  /** بروزرسانی وام در بخش مقایسه */
  const updateLoan = useCallback(
    (index: number, field: keyof LoanCompare, value: number) => {
      setLoans((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  /* ===== متغیرهای کمکی برای نمودار دایره‌ای ===== */
  const principalPercent =
    loanResults.totalRepayment > 0
      ? (loanAmount / loanResults.totalRepayment) * 100
      : 50;
  const interestPercent = 100 - principalPercent;

  /* ===== تعریف تب‌ها ===== */
  const tabs = [
    { label: "ماشین حساب وام", icon: Calculator },
    { label: "مقایسه وام‌ها", icon: Scale },
    { label: "توان بازپرداخت", icon: TrendingUp },
  ];

  /* ===== جدول بازپرداخت نمایشی (۱۲ ماه اول یا همه) ===== */
  const displaySchedule = showAllSchedule
    ? loanResults.schedule
    : loanResults.schedule.slice(0, 12);

  /* ================================================================
     رندر کامپوننت
     ================================================================ */
  return (
    <>
      {/* استایل‌های سفارشی — انیمیشن fadeIn */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in  { animation: fadeIn  0.3s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }

        /* استایل اسلایدر سفارشی */
        input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(to left, #fdba74, #f97316);
          outline: none;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.4);
          transition: transform 0.15s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.4);
        }

        /* مخفی‌سازی اسپینر ورودی عددی */
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>

      <div dir="rtl" className="w-full max-w-5xl mx-auto font-sans">
        {/* کارت اصلی */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
          {/* ======== هدر تب‌ها ======== */}
          <div className="flex border-b border-orange-100 bg-gradient-to-l from-orange-50 to-white">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 text-sm md:text-base font-medium transition-all duration-300 cursor-pointer
                    ${
                      isActive
                        ? "text-orange-600 border-b-[3px] border-orange-500 bg-white/70 shadow-sm"
                        : "text-gray-500 hover:text-orange-400 hover:bg-orange-50/50"
                    }`}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* ======== محتوای تب‌ها ======== */}
          <div className="p-4 md:p-8">
            {/* ─────────── تب ۱: ماشین حساب وام ─────────── */}
            {activeTab === 0 && (
              <div className="space-y-6 animate-fade-in">
                {/* ----- بخش ورودی‌ها ----- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* مبلغ وام */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      مبلغ وام (تومان)
                    </label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) =>
                        setLoanAmount(Number(e.target.value) || 0)
                      }
                      min={50_000_000}
                      max={5_000_000_000}
                      step={10_000_000}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-left"
                      dir="ltr"
                    />
                    <input
                      type="range"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      min={50_000_000}
                      max={5_000_000_000}
                      step={10_000_000}
                      className="w-full cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{toPersianDigits("50,000,000")} تومان</span>
                      <span className="font-medium text-orange-500">
                        {loanAmount.toLocaleString("fa-IR")} تومان
                      </span>
                      <span>{toPersianDigits("5,000,000,000")} تومان</span>
                    </div>
                  </div>

                  {/* مدت بازپرداخت */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      مدت بازپرداخت (سال)
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="range"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min={1}
                        max={30}
                        step={1}
                        className="flex-1 cursor-pointer"
                      />
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 outline-none bg-white min-w-[90px] text-sm cursor-pointer"
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(
                          (y) => (
                            <option key={y} value={y}>
                              {toPersianDigits(y)} سال
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>۱ سال</span>
                      <span className="font-medium text-orange-500">
                        {toPersianDigits(duration)} سال (
                        {toPersianDigits(duration * 12)} ماه)
                      </span>
                      <span>۳۰ سال</span>
                    </div>
                  </div>

                  {/* نرخ سود */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      نرخ سود سالانه (درصد)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={interestRate}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val < 5) val = 5;
                          if (val > 35) val = 35;
                          setInterestRate(val);
                        }}
                        min={5}
                        max={35}
                        step={0.5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        ٪
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Info size={12} />
                      نرخ سود فعلی بانک‌های ایران معمولاً ۲۳٪ است
                    </p>
                  </div>

                  {/* نوع وام */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      نوع وام
                    </label>
                    <select
                      value={loanType}
                      onChange={(e) => setLoanType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-white cursor-pointer"
                    >
                      <option value="housing">وام مسکن</option>
                      <option value="student">وام تحصیلی</option>
                      <option value="marriage">وام ازدواج</option>
                      <option value="self_employment">وام خوداشتغالی</option>
                      <option value="other">سایر وام‌ها</option>
                    </select>
                  </div>
                </div>

                {/* ----- دکمه محاسبه ----- */}
                <button
                  onClick={handleCalculate}
                  className="w-full py-4 bg-gradient-to-l from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator size={22} />
                  محاسبه
                </button>

                {/* ----- بخش نتایج ----- */}
                {isCalculated && loanAmount > 0 && (
                  <div className="space-y-6 animate-slide-up">
                    {/* کارت‌های نتیجه + نمودار دایره‌ای */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ستون چپ: کارت‌های نتیجه */}
                      <div className="space-y-4">
                        {/* قسط ماهانه — کارت اصلی */}
                        <div className="bg-gradient-to-l from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-200/50">
                          <p className="text-sm opacity-90 mb-1">قسط ماهانه</p>
                          <p className="text-3xl md:text-4xl font-black tracking-tight">
                            {loanResults.monthlyPayment.toLocaleString("fa-IR")}
                          </p>
                          <p className="text-sm opacity-80 mt-2">
                            تومان در ماه
                          </p>
                        </div>

                        {/* سود کل و مبلغ کل بازپرداخت */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-1">سود کل</p>
                            <p className="text-base font-bold text-orange-700 leading-relaxed">
                              {formatToman(loanResults.totalInterest)}
                            </p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-1">
                              مبلغ کل بازپرداخت
                            </p>
                            <p className="text-base font-bold text-gray-800 leading-relaxed">
                              {formatToman(loanResults.totalRepayment)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ستون راست: نمودار دایره‌ای */}
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-sm font-medium text-gray-600 mb-4">
                          نسبت اصل و سود
                        </p>

                        {/* نمودار دایره‌ای — pure CSS با conic-gradient */}
                        <div className="relative w-48 h-48 md:w-56 md:h-56">
                          <div
                            className="w-full h-full rounded-full shadow-inner"
                            style={{
                              background: `conic-gradient(
                                #f97316 0% ${principalPercent}%,
                                #fdba74 ${principalPercent}% 100%
                              )`,
                            }}
                          />
                          {/* دایره سفید مرکزی — افکت دونات */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
                              <span className="text-[10px] text-gray-400">
                                مبلغ کل
                              </span>
                              <span className="text-xs font-bold text-gray-700 mt-1 text-center leading-relaxed">
                                {formatToman(loanResults.totalRepayment)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* راهنمای رنگ‌ها */}
                        <div className="flex items-center gap-6 mt-5 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                            <span className="text-gray-600">
                              اصل وام:{" "}
                              {toPersianDigits(Math.round(principalPercent))}٪
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-300 shrink-0" />
                            <span className="text-gray-600">
                              سود:{" "}
                              {toPersianDigits(Math.round(interestPercent))}٪
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ----- جدول بازپرداخت ----- */}
                    <div className="mt-4">
                      {/* هدر جدول */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">
                          جدول بازپرداخت
                        </h3>
                        <button
                          onClick={handlePrint}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                        >
                          <Printer size={16} />
                          چاپ جدول
                        </button>
                      </div>

                      {/* جدول */}
                      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                        <table className="w-full text-sm min-w-[540px]">
                          <thead>
                            <tr className="bg-orange-500 text-white">
                              <th className="py-3 px-4 font-medium rounded-tr-xl">
                                ماه
                              </th>
                              <th className="py-3 px-4 font-medium">قسط</th>
                              <th className="py-3 px-4 font-medium">اصل</th>
                              <th className="py-3 px-4 font-medium">سود</th>
                              <th className="py-3 px-4 font-medium rounded-tl-xl">
                                مانده
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {displaySchedule.map((row, idx) => (
                              <tr
                                key={row.month}
                                className={`border-b border-gray-100 transition-colors ${
                                  idx % 2 === 0
                                    ? "bg-white hover:bg-orange-50/60"
                                    : "bg-orange-50/40 hover:bg-orange-50/80"
                                }`}
                              >
                                <td className="py-3 px-4 text-center text-gray-700">
                                  {toPersianDigits(row.month)}
                                </td>
                                <td className="py-3 px-4 text-center font-medium text-gray-800">
                                  {row.payment.toLocaleString("fa-IR")}
                                </td>
                                <td className="py-3 px-4 text-center text-green-700">
                                  {row.principal.toLocaleString("fa-IR")}
                                </td>
                                <td className="py-3 px-4 text-center text-red-500">
                                  {row.interest.toLocaleString("fa-IR")}
                                </td>
                                <td className="py-3 px-4 text-center text-gray-600">
                                  {row.remaining.toLocaleString("fa-IR")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* دکمه نمایش بیشتر / کمتر */}
                      {loanResults.schedule.length > 12 && !showAllSchedule && (
                        <button
                          onClick={() => setShowAllSchedule(true)}
                          className="w-full mt-3 py-3 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          نمایش بیشتر (
                          {toPersianDigits(loanResults.schedule.length - 12)}{" "}
                          ماه دیگر)
                          <ChevronDown size={16} />
                        </button>
                      )}
                      {showAllSchedule && loanResults.schedule.length > 12 && (
                        <button
                          onClick={() => setShowAllSchedule(false)}
                          className="w-full mt-3 py-3 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          نمایش کمتر (۱۲ ماه اول)
                          <ChevronDown size={16} className="rotate-180" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─────────── تب ۲: مقایسه وام‌ها ─────────── */}
            {activeTab === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* راهنما */}
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <Info size={16} className="text-orange-400 shrink-0" />
                  حداکثر ۳ وام را به صورت همزمان مقایسه کنید. ارزان‌ترین گزینه
                  با رنگ سبز مشخص می‌شود.
                </p>

                {/* کارت‌های ورودی وام */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {loans.map((loan, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border-2 p-5 space-y-4 transition-all duration-300 ${
                        cheapestIndex === idx
                          ? "border-green-400 bg-green-50/40 shadow-md shadow-green-100/50"
                          : "border-gray-200 bg-white hover:border-orange-200"
                      }`}
                    >
                      {/* عنوان کارت */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-700">
                          وام {toPersianDigits(idx + 1)}
                        </h4>
                        {cheapestIndex === idx && (
                          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                            ارزان‌ترین ✓
                          </span>
                        )}
                      </div>

                      {/* مبلغ وام */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          مبلغ وام (تومان)
                        </label>
                        <input
                          type="number"
                          value={loan.amount}
                          onChange={(e) =>
                            updateLoan(
                              idx,
                              "amount",
                              Number(e.target.value) || 0,
                            )
                          }
                          min={50_000_000}
                          max={5_000_000_000}
                          step={10_000_000}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-400 outline-none text-sm transition-colors"
                          dir="ltr"
                        />
                      </div>

                      {/* مدت بازپرداخت */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          مدت (سال)
                        </label>
                        <input
                          type="number"
                          value={loan.duration}
                          onChange={(e) =>
                            updateLoan(
                              idx,
                              "duration",
                              Math.max(1, Number(e.target.value) || 1),
                            )
                          }
                          min={1}
                          max={30}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-400 outline-none text-sm transition-colors"
                          dir="ltr"
                        />
                      </div>

                      {/* نرخ سود */}
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          نرخ سود (٪)
                        </label>
                        <input
                          type="number"
                          value={loan.rate}
                          onChange={(e) =>
                            updateLoan(idx, "rate", Number(e.target.value) || 0)
                          }
                          min={5}
                          max={35}
                          step={0.5}
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-400 outline-none text-sm transition-colors"
                          dir="ltr"
                        />
                      </div>

                      {/* نتایج این وام */}
                      <div className="border-t border-gray-100 pt-3 space-y-2.5 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">قسط ماهانه:</span>
                          <span
                            className={`font-bold ${cheapestIndex === idx ? "text-green-700" : "text-gray-800"}`}
                          >
                            {compareResults[idx]?.monthlyPayment.toLocaleString(
                              "fa-IR",
                            )}{" "}
                            تومان
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">سود کل:</span>
                          <span
                            className={`font-medium text-xs ${cheapestIndex === idx ? "text-green-700" : "text-gray-700"}`}
                          >
                            {formatToman(
                              compareResults[idx]?.totalInterest || 0,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">
                            مجموع بازپرداخت:
                          </span>
                          <span
                            className={`font-bold ${cheapestIndex === idx ? "text-green-700" : "text-gray-800"}`}
                          >
                            {formatToman(
                              compareResults[idx]?.totalRepayment || 0,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* جدول مقایسه‌ای */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="bg-orange-500 text-white">
                        <th className="py-3 px-4 font-medium text-right w-36">
                          شرط مقایسه
                        </th>
                        {loans.map((_, idx) => (
                          <th
                            key={idx}
                            className={`py-3 px-4 font-medium text-center transition-colors ${
                              cheapestIndex === idx ? "bg-green-500" : ""
                            }`}
                          >
                            وام {toPersianDigits(idx + 1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* ردیف مبلغ وام */}
                      <tr className="border-b border-gray-100 bg-white">
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          مبلغ وام
                        </td>
                        {loans.map((loan, idx) => (
                          <td
                            key={idx}
                            className={`py-3 px-4 text-center transition-colors ${
                              cheapestIndex === idx
                                ? "bg-green-50 text-green-700 font-medium"
                                : "text-gray-800"
                            }`}
                          >
                            {formatToman(loan.amount)}
                          </td>
                        ))}
                      </tr>
                      {/* ردیف قسط ماهانه */}
                      <tr className="border-b border-gray-100 bg-orange-50/30">
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          قسط ماهانه
                        </td>
                        {compareResults.map((r, idx) => (
                          <td
                            key={idx}
                            className={`py-3 px-4 text-center transition-colors ${
                              cheapestIndex === idx
                                ? "bg-green-50 text-green-700 font-bold"
                                : "text-gray-800 font-medium"
                            }`}
                          >
                            {r.monthlyPayment.toLocaleString("fa-IR")} تومان
                          </td>
                        ))}
                      </tr>
                      {/* ردیف سود کل */}
                      <tr className="border-b border-gray-100 bg-white">
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          سود کل
                        </td>
                        {compareResults.map((r, idx) => (
                          <td
                            key={idx}
                            className={`py-3 px-4 text-center transition-colors ${
                              cheapestIndex === idx
                                ? "bg-green-50 text-green-700 font-bold"
                                : "text-gray-800"
                            }`}
                          >
                            {formatToman(r.totalInterest)}
                          </td>
                        ))}
                      </tr>
                      {/* ردیف مجموع بازپرداخت */}
                      <tr className="bg-orange-50/30">
                        <td className="py-3 px-4 text-gray-700 font-bold">
                          مجموع بازپرداخت
                        </td>
                        {compareResults.map((r, idx) => (
                          <td
                            key={idx}
                            className={`py-3 px-4 text-center transition-colors ${
                              cheapestIndex === idx
                                ? "bg-green-50 text-green-700 font-black text-base"
                                : "text-gray-800 font-bold"
                            }`}
                          >
                            {formatToman(r.totalRepayment)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─────────── تب ۳: محاسبه توان بازپرداخت ─────────── */}
            {activeTab === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* راهنما */}
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <Info size={16} className="text-orange-400 shrink-0" />
                  با توجه به درآمد و هزینه‌های ماهانه، حداکثر مبلغ وامی که
                  می‌توانید دریافت کنید محاسبه می‌شود.
                </p>

                {/* ورودی‌ها */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* درآمد ماهانه */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      درآمد ماهانه (تومان)
                    </label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) =>
                        setMonthlyIncome(Number(e.target.value) || 0)
                      }
                      min={0}
                      step={1_000_000}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      dir="ltr"
                    />
                  </div>

                  {/* هزینه‌های ثابت */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      هزینه‌های ثابت ماهانه (تومان)
                    </label>
                    <input
                      type="number"
                      value={fixedExpenses}
                      onChange={(e) =>
                        setFixedExpenses(Number(e.target.value) || 0)
                      }
                      min={0}
                      step={1_000_000}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      dir="ltr"
                    />
                  </div>

                  {/* نرخ سود */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      نرخ سود سالانه (درصد)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={affordRate}
                        onChange={(e) => setAffordRate(Number(e.target.value))}
                        min={5}
                        max={35}
                        step={0.5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        ٪
                      </span>
                    </div>
                  </div>

                  {/* مدت بازپرداخت */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      مدت بازپرداخت (سال)
                    </label>
                    <input
                      type="number"
                      value={affordDuration}
                      onChange={(e) =>
                        setAffordDuration(
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                      min={1}
                      max={30}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* ----- کارت نتایج توان بازپرداخت ----- */}
                {monthlyIncome - fixedExpenses > 0 ? (
                  <div className="bg-gradient-to-l from-orange-500 to-orange-600 rounded-2xl p-8 text-white text-center space-y-5 shadow-lg shadow-orange-200/50">
                    {/* حداکثر مبلغ وام */}
                    <div>
                      <p className="text-sm opacity-90 mb-2">
                        حداکثر مبلغ وام قابل دریافت
                      </p>
                      <p className="text-3xl md:text-4xl font-black leading-relaxed">
                        {formatToman(affordResults.maxLoan)}
                      </p>
                    </div>

                    {/* جداکننده */}
                    <div className="w-24 h-px bg-white/40 mx-auto" />

                    {/* قسط ماهانه پیشنهادی */}
                    <div>
                      <p className="text-sm opacity-90 mb-1">
                        قسط ماهانه پیشنهادی
                      </p>
                      <p className="text-2xl md:text-3xl font-bold">
                        {affordResults.monthlyPayment.toLocaleString("fa-IR")}{" "}
                        تومان
                      </p>
                    </div>

                    {/* توضیح */}
                    <p className="text-xs opacity-70 mt-3">
                      توان پرداخت ماهانه شما:{" "}
                      {toPersianDigits(
                        (monthlyIncome - fixedExpenses).toLocaleString("fa-IR"),
                      )}{" "}
                      تومان
                    </p>
                  </div>
                ) : (
                  /* پیام خطا: هزینه بیشتر از درآمد */
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <p className="text-red-600 text-lg font-medium">
                      هزینه‌های ماهانه شما بیشتر از درآمدتان است.
                    </p>
                    <p className="text-red-400 text-sm mt-2">
                      امکان دریافت وام وجود ندارد. لطفاً هزینه‌های خود را بررسی
                      کنید.
                    </p>
                  </div>
                )}

                {/* جدول خلاصه ورودی‌ها */}
                {monthlyIncome - fixedExpenses > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">درآمد ماهانه</p>
                      <p className="text-sm font-bold text-gray-700 mt-1">
                        {formatToman(monthlyIncome)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">هزینه‌های ثابت</p>
                      <p className="text-sm font-bold text-gray-700 mt-1">
                        {formatToman(fixedExpenses)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">نرخ سود</p>
                      <p className="text-sm font-bold text-gray-700 mt-1">
                        {toPersianDigits(affordRate)}٪
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">مدت بازپرداخت</p>
                      <p className="text-sm font-bold text-gray-700 mt-1">
                        {toPersianDigits(affordDuration)} سال
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
