// backend/src/routes/roleRoutes.ts
import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/role.controller";

const router = Router();

// همه مسیرها: اول ورود (protect) سپس مجوزهای دقیق
router.get("/", protect, hasPermission("roles:read"), getAllRoles);
router.get("/:id", protect, hasPermission("roles:read"), getRoleById);
router.post("/", protect, hasPermission("roles:write"), createRole);
router.put("/:id", protect, hasPermission("roles:write"), updateRole);
router.delete("/:id", protect, hasPermission("roles:write"), deleteRole);

export default router;
