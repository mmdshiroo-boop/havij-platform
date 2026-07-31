// services/api/comment.api.ts
import apiClient from "./client";

export interface ICommentUser {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
}

export interface ICommentAd {
  _id: string;
  title: string;
}

export interface IComment {
  _id: string;
  content: string;
  user?: ICommentUser;
  ad?: ICommentAd;
  parent?: string;
  isApproved: boolean;
  status?: "pending" | "approved" | "rejected";
  createdAt: string;
}

export const commentApi = {
  // دریافت کامنت‌های یک آگهی
  getByAd: (adId: string) =>
    apiClient.get(`/comments/ad/${adId}`).then((res) => res.data),

  // دریافت نظرات آگهی‌های کاربر
  getMyAdsComments: () =>
    apiClient.get("/comments/my-ads").then((res) => res.data),

  // ثبت نظر جدید
  add: (data: { adId: string; content: string; parentId?: string }) =>
    apiClient.post("/comments", data).then((res) => res.data),

  // دریافت همه کامنت‌ها (ادمین)
  getAll: () => apiClient.get("/comments/admin/all").then((res) => res.data),

  // تأیید کامنت (ادمین)
  approve: (id: string) =>
    apiClient.patch(`/comments/admin/${id}/approve`).then((res) => res.data),

  // رد کامنت (ادمین)
  reject: (id: string) =>
    apiClient.patch(`/comments/admin/${id}/reject`).then((res) => res.data),

  // حذف کامنت (ادمین)
  delete: (id: string) =>
    apiClient.delete(`/comments/admin/${id}`).then((res) => res.data),
};
