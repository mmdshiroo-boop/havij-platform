import apiClient from "./client";

export interface TicketMessage {
  sender: "user" | "admin";
  message: string;
  timestamp: string;
}

export interface Ticket {
  _id: string;
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export const ticketApi = {
  // دریافت لیست تیکت‌های کاربر
  getTickets: async (status?: string): Promise<Ticket[]> => {
    const params = status && status !== "all" ? { status } : {};
    const res = await apiClient.get("/tickets", { params });
    return res.data.data;
  },

  // ایجاد تیکت جدید
  createTicket: async (data: {
    subject: string;
    message: string;
    priority?: string;
  }): Promise<Ticket> => {
    const res = await apiClient.post("/tickets", data);
    return res.data.data;
  },
  getAdminTickets: async (params?: {
    status?: string;
    priority?: string;
  }): Promise<Ticket[]> => {
    const res = await apiClient.get("/tickets/admin/all", { params });
    return res.data.data;
  },

  // ادمین: دریافت جزئیات یک تیکت
  getAdminTicket: async (id: string): Promise<Ticket> => {
    const res = await apiClient.get(`/tickets/admin/${id}`);
    return res.data.data;
  },
  updateTicketStatus: async (id: string, status: string): Promise<Ticket> => {
    const res = await apiClient.patch(`/tickets/admin/${id}/status`, {
      status,
    });
    return res.data.data;
  },
  searchTickets: async (q: string, status?: string): Promise<Ticket[]> => {
    const res = await apiClient.get("/tickets/search", {
      params: { q, status },
    });
    return res.data.data;
  },

  reopenTicket: async (id: string, message?: string): Promise<Ticket> => {
    const res = await apiClient.post(`/tickets/${id}/reopen`, { message });
    return res.data.data;
  },

  rateTicket: async (id: string, rating: number): Promise<Ticket> => {
    const res = await apiClient.post(`/tickets/${id}/rate`, { rating });
    return res.data.data;
  },
  // ادمین: پاسخ به تیکت
  adminReply: async (id: string, message: string): Promise<Ticket> => {
    const res = await apiClient.post(`/tickets/admin/${id}/reply`, { message });
    return res.data.data;
  },
  // دریافت جزئیات یک تیکت
  getTicket: async (id: string): Promise<Ticket> => {
    const res = await apiClient.get(`/tickets/${id}`);
    return res.data.data;
  },

  // ارسال پاسخ به تیکت
  replyTicket: async (id: string, message: string): Promise<Ticket> => {
    const res = await apiClient.post(`/tickets/${id}/reply`, { message });
    return res.data.data;
  },

  // بستن تیکت
  closeTicket: async (id: string): Promise<void> => {
    await apiClient.patch(`/tickets/${id}/close`);
  },
};
