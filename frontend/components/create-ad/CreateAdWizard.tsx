"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { adsApi, CreateAdData } from "@/services/api/ads.api";
import { categoryApi, Category } from "@/services/api/category.api";
import { BasicInfoStep } from "./BasicInfoStep";
import { CategoryFieldsStep } from "./CategoryFieldsStep";
import { ImagesLocationStep } from "./ImagesLocationStep";
import { ContactStep } from "./ContactStep";
import { cn } from "@/lib/utils";

export function CreateAdWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");

  const [formData, setFormData] = useState<Partial<CreateAdData>>({
    priceType: "fixed",
    adType: "sale",
    images: [],
    isUrgent: false,
    amenities: {},
    additionalProperties: [],
  });

  // دریافت تمام دسته‌ها جهت استخراج slug دسته انتخابی
  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  // با تغییر categoryId در فرم، slug آن ست می‌شود
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      const found = categories.find((c) => c._id === formData.categoryId);
      if (found) {
        setSelectedCategorySlug(found.slug || "");
      }
    }
  }, [formData.categoryId, categories]);

  // عناوین متغیر مرحله ۲ بر اساس دسته‌بندی
  const getStepTwoTitle = () => {
    const slug = selectedCategorySlug;
    if (["cars", "sedan", "motorcycle"].some((s) => slug.includes(s))) {
      return "مشخصات وسیله نقلیه";
    }
    if (["jobs", "programming", "marketing"].some((s) => slug.includes(s))) {
      return "شرایط شغلی";
    }
    if (
      ["electronics", "mobile-phones", "laptops", "home-appliances"].some((s) =>
        slug.includes(s),
      )
    ) {
      return "مشخصات کالا";
    }
    return "جزئیات تکمیلی";
  };

  const steps = [
    { id: 1, title: "اطلاعات پایه", description: "عنوان، دسته‌بندی و قیمت" },
    {
      id: 2,
      title: getStepTwoTitle(),
      description: "مشخصات اختصاصی این دسته",
    },
    {
      id: 3,
      title: "تصاویر و موقعیت",
      description: "آپلود تصاویر و انتخاب مکان",
    },
    { id: 4, title: "اطلاعات تماس", description: "شماره تماس و تأیید نهایی" },
  ];

  const updateFormData = (data: Partial<CreateAdData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!formData.title?.trim()) throw new Error("عنوان آگهی الزامی است");
      if (!formData.categoryId) throw new Error("دسته‌بندی الزامی است");
      if (
        formData.priceType !== "negotiable" &&
        (!formData.price || formData.price <= 0)
      ) {
        throw new Error("قیمت معتبر نیست");
      }
      if (!formData.city) throw new Error("شهر الزامی است");
      if (!formData.contactPhone) throw new Error("شماره تماس الزامی است");
      if (!formData.description?.trim()) throw new Error("توضیحات الزامی است");
      if (!formData.images || formData.images.length === 0) {
        throw new Error("حداقل یک تصویر الزامی است");
      }

      const response = await adsApi.create(formData);
      if (response.success) {
        toast.success("آگهی با موفقیت ثبت شد!");
        router.push("/panel/user/my-ads");
      } else {
        toast.error(response.message || "خطا در ثبت آگهی");
      }
    } catch (error: any) {
      toast.error(error.message || "خطا در ثبت آگهی");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-3xl" dir="rtl">
      {/* Timeline Progress Bar */}
      <div className="mb-6 sm:mb-10 bg-muted/30 p-3 sm:p-4 rounded-2xl border border-border/40 select-none">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div
                key={step.id}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center min-w-[50px] sm:min-w-[70px]">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border text-xs sm:text-sm font-black transition-all duration-300 shadow-xs",
                      isCompleted &&
                        "bg-primary border-primary text-primary-foreground",
                      isActive &&
                        "border-primary text-primary ring-4 ring-primary/10 scale-105 bg-background",
                      !isCompleted &&
                        !isActive &&
                        "border-border text-muted-foreground/60 bg-background",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span className="font-mono">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] mt-2 hidden sm:block font-bold text-center",
                      isActive
                        ? "text-foreground font-black"
                        : "text-muted-foreground/70",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-4 h-[2px] rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-primary transition-all duration-500 w-0",
                        isCompleted && "w-full",
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Box */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden min-h-[420px]">
        <CardHeader className="border-b border-border/40 bg-muted/10 px-4 sm:px-6 py-4">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl font-black text-foreground">
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {steps[currentStep - 1].description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-8">
          <div className="animate-in fade-in duration-300">
            {currentStep === 1 && (
              <BasicInfoStep
                data={formData}
                updateData={updateFormData}
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <CategoryFieldsStep
                data={formData}
                updateData={updateFormData}
                onNext={nextStep}
                onBack={prevStep}
                categorySlug={selectedCategorySlug}
              />
            )}
            {currentStep === 3 && (
              <ImagesLocationStep
                data={formData}
                updateData={updateFormData}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 4 && (
              <ContactStep
                data={formData}
                updateData={updateFormData}
                onSubmit={handleSubmit}
                onBack={prevStep}
                loading={loading}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
