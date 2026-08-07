"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building2,
  Calendar,
  Search,
  Filter,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/services/api/client";

interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  propertiesCount: number;
  createdAt: string;
}

export default function AgentAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    let filtered = [...agents];

    if (searchTerm) {
      filtered = filtered.filter(
        (agent) =>
          agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.phone.includes(searchTerm),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((agent) => agent.status === statusFilter);
    }

    setFilteredAgents(filtered);
  }, [agents, searchTerm, statusFilter]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/agents/agency");
      setAgents(response.data.data || []);
      setFilteredAgents(response.data.data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("خطا در دریافت لیست مشاوران");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error("لطفاً نام، نام خانوادگی و شماره تماس را وارد کنید");
      return;
    }

    try {
      if (editingAgent) {
        await apiClient.put(`/agents/${editingAgent._id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        });
        toast.success("اطلاعات مشاور با موفقیت ویرایش شد");
      } else {
        if (!formData.password) {
          toast.error("رمز عبور الزامی است");
          return;
        }
        await apiClient.post("/agents", {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
        });
        toast.success("مشاور با موفقیت اضافه شد");
      }
      setOpenDialog(false);
      resetForm();
      fetchAgents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطا در ذخیره اطلاعات");
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      await apiClient.patch(`/agents/${agent._id}/toggle-status`);
      toast.success(
        `مشاور ${agent.status === "active" ? "غیرفعال" : "فعال"} شد`,
      );
      fetchAgents();
    } catch (error) {
      toast.error("خطا در تغییر وضعیت مشاور");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await apiClient.delete(`/agents/${deleteId}`);
      toast.success("مشاور با موفقیت حذف شد");
      fetchAgents();
      setDeleteId(null);
    } catch (error) {
      toast.error("خطا در حذف مشاور");
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
    });
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      firstName: agent.firstName,
      lastName: agent.lastName,
      phone: agent.phone,
      email: agent.email || "",
      password: "",
    });
    setOpenDialog(true);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
      : "bg-gradient-to-r from-slate-500 to-slate-600";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56 mt-1" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">مدیریت مشاوران</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مدیریت تیم فروش و مشاوران املاک
          </p>
        </div>
        <Dialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300 rounded-xl">
              <Plus className="w-4 h-4" />
              افزودن مشاور
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingAgent ? "ویرایش مشاور" : "افزودن مشاور جدید"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نام</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="نام"
                    className="rounded-lg focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نام خانوادگی</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="نام خانوادگی"
                    className="rounded-lg focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>شماره موبایل</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="۰۹۱۲xxxxxxx"
                  disabled={!!editingAgent}
                  className="rounded-lg focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>ایمیل</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="example@domain.com"
                  className="rounded-lg focus:ring-primary"
                />
              </div>
              {!editingAgent && (
                <div className="space-y-2">
                  <Label>رمز عبور</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="********"
                    className="rounded-lg focus:ring-primary"
                  />
                </div>
              )}
              <Button
                onClick={handleSubmit}
                className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl"
              >
                {editingAgent ? "ویرایش مشاور" : "افزودن مشاور"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی مشاور (نام، نام خانوادگی، شماره تماس)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 rounded-xl bg-muted/30 border-0 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl ${statusFilter === "all" ? "bg-primary hover:bg-primary/90" : ""}`}
          >
            همه
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            className={`rounded-xl ${statusFilter === "active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
          >
            فعال
          </Button>
          <Button
            variant={statusFilter === "inactive" ? "default" : "outline"}
            onClick={() => setStatusFilter("inactive")}
            className={`rounded-xl ${statusFilter === "inactive" ? "bg-slate-500 hover:bg-slate-600" : ""}`}
          >
            غیرفعال
          </Button>
        </div>
      </motion.div>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">هیچ مشاوری یافت نشد</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "با فیلترهای اعمال شده مشاوری پیدا نشد"
              : "برای شروع، اولین مشاور خود را اضافه کنید"}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-2"
            >
              حذف فیلترها
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
               <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
  <div className={`h-1.5 ${getStatusColor(agent.status)}`} />
  <CardContent className="p-5">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {/* ★ اصلاح‌شده: AvatarImage + AvatarFallback بدون children */}
        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
          <AvatarImage src="/images/user.webp" alt="agent" className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-lg font-bold" />
        </Avatar>
        <div>
          <h3 className="font-bold text-lg">
            {agent.firstName} {agent.lastName}
          </h3>
          <Badge
            className={`mt-1 ${
              agent.status === "active"
                ? "bg-emerald-500"
                : "bg-slate-500"
            }`}
          >
            {agent.status === "active" ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleEdit(agent)}
          className="h-8 w-8 rounded-lg hover:bg-primary/10"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToggleStatus(agent)}
          className="h-8 w-8 rounded-lg hover:bg-primary/10"
        >
          {agent.status === "active" ? (
            <UserX className="w-4 h-4" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteId(agent._id)}
          className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>

    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Phone className="w-3.5 h-3.5" />
        <span>{agent.phone}</span>
      </div>
      {agent.email && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          <span className="truncate">{agent.email}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-3.5 h-3.5" />
        <span>{agent.propertiesCount} ملک ثبت شده</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span>
          عضویت:{" "}
          {new Date(agent.createdAt).toLocaleDateString(
            "fa-IR",
          )}
        </span>
      </div>
    </div>
  </CardContent>
</Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* آمار جمع‌بندی */}
      {agents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between items-center p-4 rounded-xl bg-muted/30"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              تعداد کل مشاوران:
            </span>
            <span className="font-bold">{agents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">فعال:</span>
            <span className="font-bold text-emerald-500">
              {agents.filter((a) => a.status === "active").length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">غیرفعال:</span>
            <span className="font-bold text-slate-500">
              {agents.filter((a) => a.status === "inactive").length}
            </span>
          </div>
        </motion.div>
      )}

      {/* Alert Dialog for Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مشاور</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف این مشاور اطمینان دارید؟
              <br />
              این عمل غیرقابل بازگشت است.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
