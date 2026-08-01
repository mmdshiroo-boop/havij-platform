// backend/src/services/auditLog.service.ts
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

  const log = new AuditLog({
    user: params.userId || null,
    action: params.action,
    resource: params.resource,
    resourceId: resourceIdStr,
    description: params.description,
    changes: params.changes,
    metadata: params.metadata,
    // ✅ استفاده از req.ip (پس از trust proxy)
    ip: params.req?.ip || params.req?.socket?.remoteAddress,
    userAgent: params.req?.headers["user-agent"],
  });

  return log.save();
}