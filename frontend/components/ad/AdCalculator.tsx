"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calculator,
  Ruler,
  DollarSign,
  Percent,
  TrendingUp,
  TrendingDown,
  Home,
  Banknote,
  BarChart3,
  CalendarClock,
  Info,
  ArrowLeftRight,
  CircleDollarSign,
} from "lucide-react";

interface AdCalculatorProps {
  price?: number;
  area?: number;
  title?: string;
}

type Tab = "price" | "loan" | "invest";

export function AdCalculator({ price, area, title }: AdCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("price");

  const [userPrice, setUserPrice] = useState(price || 0);
  const [userArea, setUserArea] = useState(area || 0);
  const [pricePerMeter, setPricePerMeter] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [loan, setLoan] = useState(0);
  const [rate, setRate] = useState(18);
  const [years, setYears] = useState(20);
  const [rent, setRent] = useState(0);

  // ─── محاسبات ───
  const calcPricePerMeter = useMemo(() => {
    if (userArea > 0 && userPrice > 0) return Math.floor(userPrice / userArea);
    return 0;
  }, [userPrice, userArea]);

  const monthly = useMemo(() => {
    if (loan <= 0 || rate <= 0 || years <= 0) return 0;
    const r = rate / 100 / 12;
    const n = years * 12;
    return Math.floor(
      (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1),
    );
  }, [loan, rate, years]);

  const totalPayback = monthly * years * 12;
  const interest = totalPayback - loan;

  const yearlyRent = rent * 12;
  const roi =
    userPrice > 0 && yearlyRent > 0 ? (yearlyRent / userPrice) * 100 : 0;
  const paybackYears =
    userPrice > 0 && yearlyRent > 0 ? Math.floor(userPrice / yearlyRent) : 0;
  const netIncome = monthly > 0 ? rent - monthly : rent;

  // ─── همگام‌سازی ───
  const onPrice = useCallback(
    (v: number) => {
      setUserPrice(v);
      if (v > 0 && userArea > 0) setPricePerMeter(Math.floor(v / userArea));
    },
    [userArea],
  );

  const onArea = useCallback(
    (v: number) => {
      setUserArea(v);
      if (v > 0 && userPrice > 0) setPricePerMeter(Math.floor(userPrice / v));
    },
    [userPrice],
  );

  const onPricePerMeter = useCallback(
    (v: number) => {
      setPricePerMeter(v);
      if (v > 0 && userArea > 0) setUserPrice(v * userArea);
    },
    [userArea],
  );

  const onDownPayment = useCallback(
    (v: number) => {
      setDownPayment(v);
      if (userPrice > 0) setLoan(Math.max(0, userPrice - v));
    },
    [userPrice],
  );

  // ─── فرمت‌کننده ───
  const toFa = (n: number) => n.toLocaleString("fa-IR");

  const money = (n: number) => {
    if (!n) return "---";
    if (n >= 1e9)
      return (n / 1e9).toFixed(1).replace(/\.0$/, "") + " میلیارد ت";
    if (n >= 1e6) return (n / 1e6).toFixed(0) + " میلیون ت";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + " هزار ت";
    return toFa(n) + " ت";
  };

  const moneyFull = (n: number) => {
    if (!n) return "";
    return toFa(n) + " تومان";
  };

  // ─── استایل مشترک اینپوت ───
  const inputClass =
    "w-full h-11 rounded-xl border-2 border-orange-100 bg-white px-4 text-sm text-right font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all";

  const labelClass =
    "text-[12px] font-bold text-gray-600 mb-1.5 flex items-center gap-1.5";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 rounded-2xl w-full h-11 text-sm font-bold border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all"
        >
          <Calculator className="w-4 h-4 " />
          ماشین حساب هوشمند ملک
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] p-0 gap-0 rounded-3xl overflow-hidden border-0 shadow-2xl bg-white">
        {/* ─── هدر نارنجی ─── */}
        <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg p-2 text-white-500 font-black leading-tight">
                ماشین حساب هوشمند ملک
              </DialogTitle>
              {title && (
                <p className="text-xs text-orange-100 mt-0.5 truncate max-w-[340px]">
                  {title}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── تب‌ها ─── */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-2 pt-1">
          {(
            [
              {
                key: "price" as Tab,
                icon: CircleDollarSign,
                label: "قیمت و متراژ",
              },
              { key: "loan" as Tab, icon: Banknote, label: "محاسبه وام" },
              {
                key: "invest" as Tab,
                icon: BarChart3,
                label: "تحلیل سرمایه‌گذاری",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 text-[12px] font-bold rounded-t-lg transition-all ${
                tab === t.key
                  ? "bg-white text-orange-600 border-b-2 border-orange-500 shadow-sm -mb-px"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ─── محتوا ─── */}
        <div className="px-5 py-5 max-h-[55vh] overflow-y-auto space-y-5">
          {/* ═══ تب ۱: قیمت و متراژ ═══ */}
          {tab === "price" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    <Ruler className="w-3.5 h-3.5 text-orange-500" />
                    متراژ (م²)
                  </label>
                  <input
                    type="number"
                    value={userArea || ""}
                    onChange={(e) => onArea(+e.target.value)}
                    placeholder="مثلاً ۸۰"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                    قیمت کل
                  </label>
                  <input
                    type="number"
                    value={userPrice || ""}
                    onChange={(e) => onPrice(+e.target.value)}
                    placeholder="۵,۰۰۰,۰۰۰,۰۰۰"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  <ArrowLeftRight className="w-3.5 h-3.5 text-orange-500" />
                  قیمت هر متر مربع (تومان)
                </label>
                <input
                  type="number"
                  value={pricePerMeter || ""}
                  onChange={(e) => onPricePerMeter(+e.target.value)}
                  placeholder="با تغییر این فیلد، قیمت کل خودکار محاسبه می‌شود"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ResultBox
                  title="قیمت هر متر"
                  value={
                    calcPricePerMeter > 0 ? money(calcPricePerMeter) : "---"
                  }
                  sub={
                    calcPricePerMeter > 0 ? moneyFull(calcPricePerMeter) : ""
                  }
                  color="orange"
                />
                <ResultBox
                  title="قیمت کل"
                  value={userPrice > 0 ? money(userPrice) : "---"}
                  sub={userPrice > 0 ? moneyFull(userPrice) : ""}
                  color="orange"
                />
              </div>
            </>
          )}

          {/* ═══ تب ۲: محاسبه وام ═══ */}
          {tab === "loan" && (
            <>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-orange-50 border border-orange-100">
                <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-gray-600">
                  پیش‌پرداخت را وارد کنید، مبلغ وام به‌صورت خودکار از تفاضل قیمت
                  کل و پیش‌پرداخت محاسبه می‌شود.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    پیش‌پرداخت
                  </label>
                  <input
                    type="number"
                    value={downPayment || ""}
                    onChange={(e) => onDownPayment(+e.target.value)}
                    placeholder="۲,۰۰۰,۰۰۰,۰۰۰"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Banknote className="w-3.5 h-3.5 text-blue-500" />
                    مبلغ وام
                  </label>
                  <input
                    type="number"
                    value={loan || ""}
                    onChange={(e) => setLoan(+e.target.value)}
                    placeholder="خودکار"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Percent className="w-3.5 h-3.5 text-amber-500" />
                    سود سالانه (%)
                  </label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(+e.target.value)}
                    placeholder="۱۸"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <CalendarClock className="w-3.5 h-3.5 text-violet-500" />
                    مدت (سال)
                  </label>
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(+e.target.value)}
                    placeholder="۲۰"
                    className={inputClass}
                  />
                </div>
              </div>

              {loan > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <ResultBox
                    title="قسط ماهانه"
                    value={money(monthly)}
                    sub={moneyFull(monthly)}
                    color="emerald"
                  />
                  <ResultBox
                    title="کل بازپرداخت"
                    value={money(totalPayback)}
                    sub={moneyFull(totalPayback)}
                    color="amber"
                  />
                  <ResultBox
                    title="سود کل بانکی"
                    value={money(interest)}
                    sub={`${toFa(Math.round((interest / loan) * 100))}% اضافه`}
                    color="red"
                  />
                  <ResultBox
                    title="نسبت وام"
                    value={`${((loan / userPrice) * 100).toFixed(1)}%`}
                    sub=""
                    color="blue"
                  />
                </div>
              )}
            </>
          )}

          {/* ═══ تب ۳: تحلیل سرمایه‌گذاری ═══ */}
          {tab === "invest" && (
            <>
              <div>
                <label className={labelClass}>
                  <Home className="w-3.5 h-3.5 text-orange-500" />
                  اجاره تخمینی ماهانه (تومان)
                </label>
                <input
                  type="number"
                  value={rent || ""}
                  onChange={(e) => setRent(+e.target.value)}
                  placeholder="اجاره ماهانه تخمینی"
                  className={inputClass}
                />
              </div>

              {rent > 0 && userPrice > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <ResultBox
                      title="بازدهی سالانه (ROI)"
                      value={roi.toFixed(1) + "%"}
                      sub={
                        roi >= 5
                          ? "سوددهی عالی"
                          : roi >= 2
                            ? "قابل قبول"
                            : "بازگشت طولانی"
                      }
                      color={roi >= 5 ? "emerald" : roi >= 2 ? "amber" : "red"}
                      icon={roi >= 5 ? TrendingUp : TrendingDown}
                    />
                    <ResultBox
                      title="زمان بازگشت"
                      value={toFa(paybackYears) + " سال"}
                      sub={`${toFa(paybackYears * 12)} ماه`}
                      color="orange"
                    />
                    <ResultBox
                      title="اجاره سالانه"
                      value={money(yearlyRent)}
                      sub={moneyFull(yearlyRent)}
                      color="emerald"
                    />
                    <ResultBox
                      title="درآمد خالص ماهانه"
                      value={
                        money(Math.abs(netIncome)) +
                        (netIncome < 0 ? " منفی" : "")
                      }
                      sub={
                        monthly > 0
                          ? `اجاره ${money(rent)} − قسط ${money(monthly)}`
                          : ""
                      }
                      color={netIncome >= 0 ? "emerald" : "red"}
                    />
                  </div>

                  {/* نوار پیشرفت ROI */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-500">
                        مقیاس بازدهی
                      </span>
                      <span
                        className={`text-sm font-black ${roi >= 5 ? "text-emerald-600" : roi >= 2 ? "text-amber-600" : "text-red-500"}`}
                      >
                        {roi.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          roi >= 5
                            ? "bg-emerald-500"
                            : roi >= 2
                              ? "bg-amber-500"
                              : "bg-red-400"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(2, roi * 4))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 px-0.5">
                      <span>۰٪</span>
                      <span>ضعیف</span>
                      <span>متوسط</span>
                      <span>عالی</span>
                    </div>
                  </div>
                </>
              )}

              {rent === 0 && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-7 h-7 text-orange-300" />
                  </div>
                  <p className="text-sm text-gray-400">
                    اجاره تخمینی را وارد کنید
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   کارت نتیجه
   ══════════════════════════════════════════════ */
function ResultBox({
  title,
  value,
  sub,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub?: string;
  color: "orange" | "emerald" | "amber" | "red" | "blue";
  icon?: React.ElementType;
}) {
  const borders: Record<string, string> = {
    orange: "border-orange-200 bg-orange-50/80",
    emerald: "border-emerald-200 bg-emerald-50/80",
    amber: "border-amber-200 bg-amber-50/80",
    red: "border-red-200 bg-red-50/80",
    blue: "border-blue-200 bg-blue-50/80",
  };

  const texts: Record<string, string> = {
    orange: "text-orange-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-600",
    blue: "text-blue-700",
  };

  return (
    <div
      className={`rounded-2xl border p-3.5 transition-all hover:shadow-md ${borders[color]}`}
    >
      <p className="text-[11px] font-medium text-gray-400 mb-1">{title}</p>
      <div
        className={`flex items-center gap-1.5 text-[15px] font-black leading-tight ${texts[color]}`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {value}
      </div>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
