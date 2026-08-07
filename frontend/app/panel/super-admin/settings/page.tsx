// app/panel/super-admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "@/services/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Save,
  Globe,
  Mail,
  Shield,
  Bell,
  Database,
  DollarSign,
  Smartphone,
  Server,
  RefreshCw,
  AlertCircle,
  FileText,
  Activity,
  HelpCircle,
  Info,
  Share2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { FaqEditor } from "@/components/panel/FaqEditor";

/* ──── تعریف کمکی FaqItem (در صورت نیاز) ──── */
interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

/* ──── Schema ──── */
const settingsSchema = z.object({
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  siteLogo: z.string().optional(),
  favicon: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  socialLinks: z
    .object({
      telegram: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
  adApprovalRequired: z.boolean().optional(),
  maxAdImages: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().optional(),
  ),
  defaultAdDuration: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().optional(),
  ),
  vipAdPrice: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().optional(),
  ),
  enableSmsNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  enablePushNotifications: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  itemsPerPage: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().optional(),
  ),
  cacheDuration: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().optional(),
  ),
  pages: z
    .object({
      aboutUs: z.string().optional(),
      aboutMission: z.string().optional(),
      aboutTeam: z.string().optional(),
      aboutSecurity: z.string().optional(),
      aboutSpeed: z.string().optional(),
      contactInfo: z.string().optional(),
      helpFaqs: z.string().optional(),
      privacyText: z.string().optional(),
      rulesText: z.string().optional(),
      supportFaqs: z.string().optional(),
      supportContactText: z.string().optional(),
    })
    .optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

/* ──── Sub-components ──── */
function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>; // ★ اصلاح‌شده
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border border-border/70 shadow-[0_1px_3px_hsl(240_5%_0%_/_0.05)] rounded-xl",
        className,
      )}
    >
      <CardHeader className="bg-muted/40 border-b border-border/60 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-[0.95rem] font-bold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-5 space-y-4">{children}</CardContent>
    </Card>
  );
}

function SwitchRow({
  label,
  description,
  icon: Icon,
  checked,
  onCheckedChange,
  danger,
}: {
  label: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>; // ★ اصلاح‌شده
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border-[1.5px] px-4 py-3",
        "transition-all duration-150",
        danger && checked
          ? "border-destructive/40 bg-destructive/5"
          : "border-border/80 bg-muted/30 hover:border-border hover:bg-background",
      )}
    >
      <div className="space-y-0.5 flex-1">
        <p className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5 text-secondary" />}
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex justify-between items-center py-2.5 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground/90">{children}</span>
      </div>
      <Separator />
    </>
  );
}

const menuItems = [
  { id: "general", label: "عمومی", icon: Globe },
  { id: "contact", label: "تماس", icon: Mail },
  { id: "social", label: "شبکه‌های اجتماعی", icon: Share2 },
  { id: "ads", label: "آگهی‌ها", icon: FileText },
  { id: "notifications", label: "اعلان‌ها", icon: Bell },
  { id: "system", label: "سیستم", icon: Server },
  { id: "pages", label: "صفحات", icon: FileText },
];

/* ──── Page Component ──── */
export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState("general");

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema) as any, // ✅ رفع خطای TS با توجه به نسخه
    defaultValues: {
      siteName: "پلتفرم آگهی هویج",
      siteDescription: "",
      siteLogo: "/logo.webp",
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
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/super-admin/settings");
      if (data.success && data.data) {
        form.reset({
          ...form.getValues(),
          ...data.data,
        });
      }
    } catch (error) {
      toast.error("خطا در دریافت تنظیمات");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (payload: SettingsValues) => {
    setSaving(true);
    try {
      const response = await axios.put("/super-admin/settings", payload);
      if (response.data.success) {
        toast.success("تنظیمات با موفقیت ذخیره شد");
        window.dispatchEvent(new Event("settings-updated"));
        const channel = new BroadcastChannel("settings_channel");
        channel.postMessage({ type: "SETTINGS_UPDATED" });
        channel.close();
      }
    } catch (error) {
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isDirty = form.formState.isDirty;

  const renderContent = () => {
    switch (activeMenu) {
      case "general":
        return (
          <div className="space-y-5">
            <SettingsCard
              icon={Globe}
              title="اطلاعات عمومی"
              description="نام، توضیحات و ظاهر سایت را تنظیم کنید"
            >
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      نام سایت
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="نام سایت" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      توضیحات سایت
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="توضیحات سایت"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      این توضیحات در موتورهای جستجو نمایش داده می‌شود
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      آدرس لوگو
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="/logo.webp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="favicon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      آدرس Favicon
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="/favicon.ico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsCard>

            <SettingsCard
              icon={Database}
              title="تنظیمات نمایش"
              description="تعداد آیتم‌ها در هر صفحه و مدیریت کش"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemsPerPage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        تعداد آیتم در هر صفحه
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseInt(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cacheDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">
                        مدت زمان کش (ثانیه)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseInt(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SettingsCard>
          </div>
        );

      case "contact":
        return (
          <SettingsCard
            icon={Mail}
            title="اطلاعات تماس"
            description="اطلاعات تماس پشتیبانی و ارتباط با کاربران"
          >
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    ایمیل پشتیبانی
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="info@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    شماره تماس
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="021-12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">آدرس</FormLabel>
                  <FormControl>
                    <Input placeholder="آدرس دفتر مرکزی" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsCard>
        );

      case "social":
        return (
          <SettingsCard
            icon={Share2}
            title="شبکه‌های اجتماعی"
            description="لینک‌های شبکه‌های اجتماعی که در فوتر نمایش داده می‌شوند"
          >
            <FormField
              control={form.control}
              name="socialLinks.telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تلگرام</FormLabel>
                  <FormControl>
                    <Input placeholder="https://t.me/..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اینستاگرام</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توییتر</FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>لینکدین</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://linkedin.com/in/..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </SettingsCard>
        );

      case "ads":
        return (
          <div className="grid gap-5 md:grid-cols-2">
            <SettingsCard
              icon={Shield}
              title="قوانین ثبت آگهی"
              description="محدودیت‌ها و قوانین ثبت آگهی"
            >
              <FormField
                control={form.control}
                name="adApprovalRequired"
                render={({ field }) => (
                  <SwitchRow
                    label="نیاز به تأیید ادمین"
                    description="آگهی‌ها قبل از انتشار نیاز به تأیید دارند"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="maxAdImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      حداکثر تعداد تصاویر
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultAdDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      مدت زمان پیش‌فرض آگهی (روز)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsCard>
            <SettingsCard
              icon={DollarSign}
              title="آگهی ویژه"
              description="تنظیمات آگهی‌های ویژه و VIP"
            >
              <FormField
                control={form.control}
                name="vipAdPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      قیمت آگهی ویژه (تومان)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsCard>
          </div>
        );

      case "notifications":
        return (
          <SettingsCard
            icon={Bell}
            title="کانال‌های اعلان"
            description="انتخاب روش‌های ارسال اعلان به کاربران"
          >
            <FormField
              control={form.control}
              name="enableSmsNotifications"
              render={({ field }) => (
                <SwitchRow
                  label="ارسال اعلان پیامکی"
                  description="ارسال پیامک برای رویدادهای مهم"
                  icon={Smartphone}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="enableEmailNotifications"
              render={({ field }) => (
                <SwitchRow
                  label="ارسال اعلان ایمیل"
                  description="ارسال ایمیل برای اطلاع‌رسانی‌ها"
                  icon={Mail}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <FormField
              control={form.control}
              name="enablePushNotifications"
              render={({ field }) => (
                <SwitchRow
                  label="ارسال اعلان درون برنامه‌ای"
                  description="نمایش اعلان در پنل کاربری"
                  icon={Bell}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </SettingsCard>
        );

      case "system":
        return (
          <div className="grid gap-5 md:grid-cols-2">
            <SettingsCard
              icon={Server}
              title="حالت‌های سیستم"
              description="تنظیمات پیشرفته و حالت‌های خاص"
            >
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <SwitchRow
                    label="حالت تعمیرات"
                    description="سایت فقط برای ادمین‌ها قابل دسترسی است"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    danger
                  />
                )}
              />
            </SettingsCard>
            <SettingsCard
              icon={Activity}
              title="اطلاعات سیستم"
              description="وضعیت فعلی سیستم"
            >
              <InfoRow label="نسخه سایت">v2.0.0</InfoRow>
              <InfoRow label="آخرین بروزرسانی">
                {new Date().toLocaleDateString("fa-IR")}
              </InfoRow>
              <div className="flex justify-between items-center py-2.5 text-sm">
                <span className="text-muted-foreground">محیط اجرا</span>
                <Badge
                  variant={
                    process.env.NODE_ENV === "production"
                      ? "default"
                      : "secondary"
                  }
                  className={cn(
                    "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                    process.env.NODE_ENV !== "production" &&
                      "bg-secondary/20 text-secondary border-secondary/30",
                  )}
                >
                  {process.env.NODE_ENV === "production" ? "تولید" : "توسعه"}
                </Badge>
              </div>
            </SettingsCard>
          </div>
        );

      case "pages":
        return (
          <div className="space-y-6">
            <SettingsCard
              icon={FileText}
              title="درباره ما"
              description="متن اصلی و آیتم‌های صفحه درباره ما"
            >
              <FormField
                control={form.control}
                name="pages.aboutUs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>متن اصلی</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pages.aboutMission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مأموریت ما</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pages.aboutTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تیم ما</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pages.aboutSecurity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>امنیت</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pages.aboutSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سرعت</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SettingsCard>

            <SettingsCard
              icon={Mail}
              title="تماس با ما"
              description="متن معرفی صفحه تماس با ما"
            >
              <FormField
                control={form.control}
                name="pages.contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>متن تماس با ما</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SettingsCard>

            <SettingsCard
              icon={HelpCircle}
              title="راهنما"
              description="سوالات متداول (JSON)"
            >
              <FormField
                control={form.control}
                name="pages.helpFaqs"
                render={({ field }) => {
                  const currentFaqs: FaqItem[] = (() => {
                    try {
                      return JSON.parse(field.value || "[]");
                    } catch {
                      return [];
                    }
                  })();
                  return (
                    <FormItem>
                      <FormLabel>سوالات متداول</FormLabel>
                      <FormControl>
                        <FaqEditor
                          value={currentFaqs.map((item) => ({
                            ...item,
                            category: item.category || "general",
                          }))}
                          onChange={(newFaqs) =>
                            field.onChange(JSON.stringify(newFaqs))
                          }
                          categories={["general", "ads", "payment", "account"]}
                        />
                      </FormControl>
                      <FormDescription>
                        سوالات متداول را به‌صورت بصری مدیریت کنید.
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />
            </SettingsCard>

            <SettingsCard
              icon={Shield}
              title="حریم خصوصی"
              description="متن کامل صفحه حریم خصوصی"
            >
              <FormField
                control={form.control}
                name="pages.privacyText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>متن حریم خصوصی</FormLabel>
                    <FormControl>
                      <Textarea rows={10} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SettingsCard>

            <SettingsCard
              icon={FileText}
              title="قوانین و مقررات"
              description="متن کامل صفحه قوانین"
            >
              <FormField
                control={form.control}
                name="pages.rulesText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>متن قوانین</FormLabel>
                    <FormControl>
                      <Textarea rows={10} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SettingsCard>

            <SettingsCard
              icon={HelpCircle}
              title="پشتیبانی"
              description="FAQ و متن راه‌های ارتباطی"
            >
              <FormField
                control={form.control}
                name="pages.supportFaqs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FAQها (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={8}
                        className="font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pages.supportContactText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>راه‌های ارتباطی</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SettingsCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تنظیمات سایت</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت تنظیمات کلی سیستم و پیکربندی سایت
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDirty && (
            <Badge
              variant="outline"
              className="gap-1 text-[0.72rem] font-medium bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-1 rounded-full"
            >
              <AlertCircle className="h-3 w-3" /> تغییرات ذخیره نشده
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            className="gap-1.5 hover:[&_svg]:rotate-180 [&_svg]:transition-transform [&_svg]:duration-300"
          >
            <RefreshCw className="h-3.5 w-3.5" /> بازنشانی
          </Button>
          <Button
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
            disabled={saving}
            className={cn(
              "gap-1.5 shadow-[0_2px_10px_hsl(var(--primary)_/_0.25)]",
              "hover:shadow-[0_4px_16px_hsl(var(--primary)_/_0.35)] hover:brightness-105 transition-all",
            )}
          >
            <Save className="h-3.5 w-3.5" />{" "}
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-[20%] lg:w-[18%]">
              <div className="sticky top-20 space-y-1.5 bg-background/50 rounded-xl p-2 border border-border/50">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveMenu(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 text-right",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isActive && "text-primary-foreground",
                        )}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="w-full md:w-[80%] lg:w-[82%]">
              <div className="animate-slide-up">{renderContent()}</div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}