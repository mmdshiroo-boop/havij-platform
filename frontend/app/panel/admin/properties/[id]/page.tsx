// app/admin/properties/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, Building } from "lucide-react";
import apiClient from "@/services/api/client";

interface Property {
  _id: string;
  title: string;
  price: number;
  city: string;
  status: "pending" | "active" | "sold" | "rejected";
  agentName?: string;
  createdAt: string;
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await apiClient.get("/properties/admin/all?status=pending");
      setProperties(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error("خطا در دریافت املاک");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/properties/admin/${id}/status`, {
        status: "active",
      });
      toast.success("ملک تایید شد");
      fetchProperties(); // بازخوانی لیست
    } catch (error) {
      toast.error("خطا در تایید ملک");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/properties/admin/${id}/status`, {
        status: "rejected",
      });
      toast.success("ملک رد شد");
      fetchProperties();
    } catch (error) {
      toast.error("خطا در رد ملک");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مدیریت املاک</h1>
        <p className="text-muted-foreground">املاک در انتظار تایید</p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            هیچ ملکی در انتظار تایید نیست
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <Card key={property._id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{property.title}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>{property.city}</span>
                      <span className="mx-2">•</span>
                      <span>{property.agentName || "آژانس"}</span>
                    </div>
                    <p className="text-primary font-bold mt-2">
                      {property.price.toLocaleString()} تومان
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Badge className="bg-amber-500">در انتظار تایید</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `/panel/agent/properties/${property._id}`,
                          "_blank",
                        )
                      }
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => handleApprove(property._id)}
                      disabled={actionLoading === property._id}
                    >
                      <CheckCircle className="w-4 h-4 ml-1" />
                      تایید
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(property._id)}
                      disabled={actionLoading === property._id}
                    >
                      <XCircle className="w-4 h-4 ml-1" />
                      رد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
