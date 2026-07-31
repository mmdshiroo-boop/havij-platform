// backend/src/routes/locationMap.routes.ts
import { Router } from "express";
import {
  getLocationStats,
  getUsersLocations,
  exportLocationsExcel,
} from "../controllers/locationMap.controller";
import { protect, adminOnly } from "../middleware/auth.middleware";

const router = Router();

router.get("/admin/stats", protect, adminOnly, getLocationStats);
router.get("/admin/list", protect, adminOnly, getUsersLocations);
router.get("/admin/export-excel", protect, adminOnly, exportLocationsExcel);

export default router;