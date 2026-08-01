import { AuditLog, AuditAction, IAuditLog } from "../models/AuditLog.model";
import { Request } from "express";

interface CreateLogParams {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string | string[];
  description: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  req?: Request;
}

export async function createAuditLog(
  params: CreateLogParams,
): Promise<IAuditLog> {
  const resourceIdStr = Array.isArray(params.resourceId)
    ? params.resourceId[0]
    : params.resourceId;

  // ✅ استخراج IP واقعی از هدر x-forwarded-for (با fallback به req.socket)
  const forwarded = (params.req?.headers["x-forwarded-for"] as string) || "";
  const ip = forwarded.split(",")[0]?.trim() || params.req?.socket?.remoteAddress;

  const log = new AuditLog({
    user: params.userId || null,
    action: params.action,
    resource: params.resource,
    resourceId: resourceIdStr,
    description: params.description,
    changes: params.changes,
    metadata: params.metadata,
    ip,
    userAgent: params.req?.headers["user-agent"],
  });

  return log.save();
}