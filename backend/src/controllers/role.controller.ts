// backend/src/controllers/role.controller.ts
import { Response } from "express";
import Role from "../models/Role";
import { AuthRequest } from "../middleware/auth.middleware";
import { createAuditLog } from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog.model";

export const getAllRoles = async (req: AuthRequest, res: Response) => {
  const roles = await Role.find().sort({ createdAt: -1 });
  res.json(roles);
};

export const getRoleById = async (req: AuthRequest, res: Response) => {
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ message: "نقش یافت نشد" });
  res.json(role);
};

export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, label, permissions } = req.body;
    const role = await Role.create({ name, label, permissions });

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Role",
      resourceId: role._id.toString(),
      description: `ادمین ${req.user?.firstName || req.user?.phone} نقش جدید "${role.name}" را ایجاد کرد.`,
      metadata: { permissions },
      req,
    });

    res.status(201).json(role);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, label, permissions, isActive } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, label, permissions, isActive },
      { new: true },
    );
    if (!role) return res.status(404).json({ message: "نقش یافت نشد" });

    // Audit log
    await createAuditLog({
      userId: req.user?._id?.toString(),
      action: AuditAction.SYSTEM,
      resource: "Role",
      resourceId: role._id.toString(),
      description: `ادمین ${req.user?.firstName || req.user?.phone} نقش "${role.name}" را ویرایش کرد.`,
      metadata: { changes: req.body },
      req,
    });

    res.json(role);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  const role = await Role.findByIdAndDelete(req.params.id);
  if (!role) return res.status(404).json({ message: "نقش یافت نشد" });

  // Audit log
  await createAuditLog({
    userId: req.user?._id?.toString(),
    action: AuditAction.SYSTEM,
    resource: "Role",
    resourceId: req.params.id,
    description: `ادمین ${req.user?.firstName || req.user?.phone} نقش "${role.name}" را حذف کرد.`,
    req,
  });

  res.json({ message: "نقش با موفقیت حذف شد" });
};
