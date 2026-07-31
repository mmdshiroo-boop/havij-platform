// app/panel/vip/vip-ads/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  CalendarDays,
  Zap,
  Star,
  MapPin,
  ImageIcon,
  RefreshCw,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api/client";
import { getImageUrl } from "@/lib/utils";

// ======================== Types ========================
interface VipPlan {
  id: string;
  name: string;
  duration: number;
  price: number;
  features: string[];
  color: string;
}

const vipPlans: VipPlan[] = [
  {
    id: "basic",
    name: "پایه",
    duration: 7,
    price: 49000,
    features: ["برجسته شدن در نتایج جستجو", "نمایش در بالای لیست", "مدت ۷ روز"],
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "standard",
    name: "استاندارد",
    duration: 30,
    price: 149000,
    features: [
      "برجسته شدن در نتایج جستجو",
      "نمایش در بالای لیست",
      "آیکون ویژه",
      "مدت ۳۰ روز",
    ],
    color: "from-orange-400 to-red-500",
  },
  {
    id: "premium",
    name: "پرمیوم",
    duration: 90,
    price: 399000,
    features: [
      "برجسته شدن در نتایج جستجو",
      "نمایش در بالای لیست",
      "آیکون ویژه",
      "اولویت در پشتیبانی",
      "مدت ۹۰ روز",
    ],
    color: "from-purple-500 to-pink-500",
  },
];

// ======================== Helpers ========================
const formatMoney = (value: number) => {
  if (!value) return "—";
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1)} میلیارد`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} میلیون`;
  return value.toLocaleString("fa-IR") + " تومان";
};

export default function VipAdsUpgradePage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedAd, setSelectedAd] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("standard");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await apiClient.get("/ads/user/me");
      setAds(response.data.data || []);
    } catch (err) {
      console.error("Error fetching ads:", err);
      toast.error("خطا در دریافت آگهی‌ها");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedAd) {
      toast.error("لطفاً آگهی مورد نظر را انتخاب کنید");
      return;
    }
    const plan = vipPlans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setProcessing(true);
    try {
      const response = await apiClient.post("/ads/vip/upgrade", {
        adId: selectedAd,
        duration: plan.duration,
        price: plan.price,
      });
      if (response.data.success) {
        toast.success(`آگهی با موفقیت ویژه شد (${plan.name})`);
        fetchAds();
        setSelectedAd("");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ویژه کردن آگهی");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-4"
        dir="rtl"
      >
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-muted-foreground font-medium">
          متأسفانه اطلاعات بارگذاری نشد.
        </p>
        <Button
          onClick={fetchAds}
          variant="outline"
          className="gap-2 rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const nonVipAds = ads.filter((ad) => !ad.isVip);

  return (
    <div className="space-y-6">
      {/* ========== Header ========== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-500/15 via-amber-500/5 to-transparent p-6 border border-amber-500/20 shadow-md backdrop-blur-md bg-card/60">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 rounded-xl ring-1 ring-amber-500/30">
            <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              ارتقا به آگهی ویژه
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              آگهی خود را ویژه کنید و بازدید چند برابری دریافت کنید
            </p>
          </div>
        </div>
      </div>

      {/* ========== Stats ========== */}
      {nonVipAds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md bg-gradient-to-br from-amber-50/10 to-transparent">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground">
                آگهی قابل ارتقا
              </p>
              <p className="text-3xl font-black text-foreground">
                {nonVipAds.length}
              </p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md bg-gradient-to-br from-amber-50/10 to-transparent">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground">
                آگهی‌های ویژه فعلی
              </p>
              <p className="text-3xl font-black text-foreground">
                {ads.filter((ad) => ad.isVip).length}
              </p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md bg-gradient-to-br from-amber-50/10 to-transparent">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground">
                افزایش بازدید
              </p>
              <p className="text-3xl font-black text-emerald-600">+۸۵٪</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== Select Ad ========== */}
      {nonVipAds.length > 0 ? (
        <>
          <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-lg">
                  <Star className="w-4 h-4" />
                </div>
                انتخاب آگهی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {nonVipAds.map((ad) => (
                  <label
                    key={ad._id}
                    className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAd === ad._id
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 shadow-sm"
                        : "border-border hover:border-amber-300 hover:bg-muted/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ad"
                      value={ad._id}
                      checked={selectedAd === ad._id}
                      onChange={() => setSelectedAd(ad._id)}
                      className="w-4 h-4 text-amber-500 cursor-pointer"
                    />
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted/30 border border-border/40 flex-shrink-0">
                      {ad.images?.[0] ? (
                        <img
                          src={getImageUrl(ad.images[0])}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{ad.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ad.city}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{ad.views || 0} بازدید</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>{formatMoney(ad.price)}</span>
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold rounded-full px-3 py-1 border-amber-300 text-amber-600"
                    >
                      قابل ارتقا
                    </Badge>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ========== Select Plan ========== */}
          {selectedAd && (
            <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md transition-shadow bg-gradient-to-br from-amber-50/10 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-lg">
                    <Crown className="w-4 h-4" />
                  </div>
                  انتخاب پلن ویژه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vipPlans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 shadow-md shadow-amber-500/10"
                          : "border-border hover:border-amber-300 hover:bg-muted/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={() => setSelectedPlan(plan.id)}
                        className="absolute top-5 right-5 w-4 h-4 text-amber-500 cursor-pointer"
                      />
                      <div className="pr-6">
                        <h3 className="text-lg font-black">{plan.name}</h3>
                        <div className="mt-3">
                          <span className="text-2xl font-black text-amber-600 tabular-nums">
                            {plan.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground mr-1">
                            تومان
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground font-bold">
                          <CalendarDays className="w-4 h-4 text-amber-500/70" />
                          {plan.duration} روز
                        </div>
                        <ul className="mt-4 space-y-2 text-sm">
                          {plan.features.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-muted-foreground"
                            >
                              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center">
                                <Zap className="w-3 h-3" />
                              </div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAd("")}
                    className="rounded-xl h-10 text-xs font-bold"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={handleUpgrade}
                    disabled={processing}
                    className="flex-1 rounded-xl h-10 text-xs font-extrabold gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4" />
                    )}
                    ارتقا به آگهی ویژه
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-amber-500/60" />
            </div>
            <p className="text-muted-foreground font-bold">
              همهٔ آگهی‌های شما ویژه هستند! 🎉
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
