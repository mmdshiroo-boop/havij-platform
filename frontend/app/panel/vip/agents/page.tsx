// app/panel/vip/agents/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Users,
  Phone,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  X,
  User,
  Lock,
  Mail,
  CreditCard,
  Loader2,
  FileSpreadsheet,
  FileText,
  Edit2,
  Building2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { agentApi, Agent, CreateAgentData } from "@/services/api/agent.api";

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nationalCode, setNationalCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getAgents();
      setAgents(data || []);
    } catch (err) {
      console.error("خطا در دریافت لیست مشاوران:", err);
      toast.error("خطا در دریافت لیست کارشناسان");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setFirstName(agent.firstName);
    setLastName(agent.lastName);
    setPhone(agent.phone);
    setEmail(agent.email || "");
    setNationalCode(agent.nationalCode || "");
    setPassword("");
    setFormError(null);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingAgent(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setNationalCode("");
    setPassword("");
    setFormError(null);
    setShowModal(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await agentApi.toggleStatus(id);
      loadAgents();
      toast.success("وضعیت کارشناس تغییر کرد");
    } catch (err) {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("آیا از حذف این مشاور و حساب کاربر مرتبط با آن مطمئن هستید؟")) {
      try {
        await agentApi.delete(id);
        loadAgents();
        toast.success("کارشناس با موفقیت حذف شد");
      } catch (err) {
        toast.error("خطا در حذف کارشناس");
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setFormError("فیلدهای نام، نام خانوادگی و شماره تماس الزامی هستند.");
      return;
    }

    if (!editingAgent && !password) {
      setFormError("تعیین رمز عبور برای کارشناس جدید الزامی است.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload: CreateAgentData = {
        firstName,
        lastName,
        phone,
        email,
        nationalCode,
        ...(password ? { password } : {}),
      };

      if (editingAgent) {
        await agentApi.update(editingAgent._id, payload);
        toast.success("اطلاعات کارشناس به‌روز شد");
      } else {
        await agentApi.create(payload);
        toast.success("کارشناس جدید با موفقیت ثبت شد");
      }

      setShowModal(false);
      loadAgents();
    } catch (err: any) {
      const msg = err.response?.data?.message || "عملیات با خطا مواجه شد";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading("excel");
      await agentApi.downloadReportExcel();
      toast.success("گزارش Excel دانلود شد");
    } catch (err) {
      toast.error("خطا در دانلود گزارش");
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading("pdf");
      await agentApi.downloadReportPDF();
      toast.success("گزارش PDF دانلود شد");
    } catch (err) {
      toast.error("خطا در دانلود گزارش");
    } finally {
      setIsDownloading(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 px-3 sm:px-6 pb-8"
      dir="rtl"
    >
      {/* ========== Header ========== */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-5 sm:p-6 border border-primary/20 shadow-md"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                مدیریت کارشناسان آژانس
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                کنترل دسترسی، تغییر وضعیت فعالیت و دریافت گزارشات عملکرد
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={isDownloading !== null}
              className="gap-1.5 rounded-xl text-xs font-bold border-border/60 hover:bg-muted"
            >
              {isDownloading === "excel" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading !== null}
              className="gap-1.5 rounded-xl text-xs font-bold border-border/60 hover:bg-muted"
            >
              {isDownloading === "pdf" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              PDF
            </Button>

            <Button
              onClick={openAddModal}
              className="gap-2 rounded-xl h-10 px-5 text-xs font-bold shadow-md shadow-primary/10"
            >
              <UserPlus className="w-4 h-4" />
              افزودن کارشناس
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ========== Stats Overview ========== */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                کل کارشناسان
              </p>
              <p className="text-3xl font-black text-foreground tabular-nums">
                {agents.length}
              </p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                کارشناسان فعال
              </p>
              <p className="text-3xl font-black text-emerald-600 tabular-nums">
                {agents.filter((a) => a.status === "active").length}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm rounded-2xl bg-card/80 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                کل املاک
              </p>
              <p className="text-3xl font-black text-foreground tabular-nums">
                {agents.reduce((sum, a) => sum + (a.propertiesCount || 0), 0)}
              </p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ========== Agents Grid ========== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground bg-card/30 border border-dashed border-border/60 rounded-2xl">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">
              هیچ کارشناسی برای آژانس شما ثبت نشده است.
            </p>
            <Button
              variant="link"
              onClick={openAddModal}
              className="mt-2 font-bold text-primary"
            >
              افزودن اولین عضو تیم
            </Button>
          </div>
        ) : (
          agents.map((agent, i) => (
            <motion.div
              key={agent._id}
              variants={itemVariants}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all rounded-2xl bg-card/80 backdrop-blur-sm group overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-black shrink-0">
                      {agent.firstName[0]}
                      {agent.lastName[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm truncate">
                        {agent.firstName} {agent.lastName}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Phone className="w-3 h-3" />
                        <span className="font-mono dir-ltr">{agent.phone}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          onClick={() => handleToggleStatus(agent._id)}
                          className={cn(
                            "text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold transition-colors border",
                            agent.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                          )}
                          title="کلیک کنید تا وضعیت تغییر کند"
                        >
                          {agent.status === "active" ? (
                            <>
                              <ShieldCheck className="w-3 h-3" /> فعال
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" /> غیرفعال
                            </>
                          )}
                        </button>

                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold rounded-full px-2.5 py-0.5"
                        >
                          {agent.propertiesCount || 0} ملک
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(agent)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="ویرایش اطلاعات"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(agent._id)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="حذف کامل کارشناس"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* ========== Modal (افزودن / ویرایش) ========== */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/40 bg-muted/20">
                <h2 className="text-sm font-black text-foreground">
                  {editingAgent
                    ? `ویرایش اطلاعات: ${editingAgent.firstName}`
                    : "ثبت کارشناس جدید"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={handleFormSubmit}
                className="p-5 space-y-4 max-h-[85vh] overflow-y-auto"
              >
                {formError && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs font-semibold rounded-xl border border-destructive/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 text-primary" /> نام *
                    </label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="مثلاً: رضا"
                      className="h-10 rounded-xl bg-muted/40 border-border/60 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      نام خانوادگی *
                    </label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="مثلاً: حسینی"
                      className="h-10 rounded-xl bg-muted/40 border-border/60 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3 text-primary" /> شماره تماس (نام کاربری) *
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="h-10 rounded-xl text-left font-mono bg-muted/40 border-border/60 focus:ring-primary"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3 text-primary" />
                    {editingAgent
                      ? "رمز عبور جدید (در صورت نیاز به تغییر)"
                      : "رمز عبور کارشناس *"}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingAgent ? "••••••••" : "حداقل ۶ کاراکتر"}
                    className="h-10 rounded-xl text-left bg-muted/40 border-border/60 focus:ring-primary"
                    dir="ltr"
                    required={!editingAgent}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-primary" /> کد ملی
                  </label>
                  <Input
                    type="text"
                    value={nationalCode}
                    onChange={(e) => setNationalCode(e.target.value)}
                    placeholder="اختیاری"
                    className="h-10 rounded-xl text-left font-mono bg-muted/40 border-border/60 focus:ring-primary"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3 text-primary" /> آدرس ایمیل
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-10 rounded-xl text-left bg-muted/40 border-border/60 focus:ring-primary"
                    dir="ltr"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-3 border-t border-border/40">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-10 rounded-xl text-sm font-extrabold gap-2 shadow-md shadow-primary/10"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingAgent ? (
                      "ذخیره تغییرات"
                    ) : (
                      "ثبت و فعال‌سازی"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl h-10 text-sm font-bold border-border/60 hover:bg-muted"
                  >
                    انصراف
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}