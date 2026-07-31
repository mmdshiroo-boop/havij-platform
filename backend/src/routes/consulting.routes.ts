import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  createConsultingRequest,
  getConsultingRequests,
  updateConsultingStatus,
  getMyConsultingRequests,
} from "../controllers/consulting.controller";

const router = Router();

// مسیر عمومی – ثبت درخواست
router.post("/", createConsultingRequest);

// مسیرهای نیازمند احراز هویت
router.get("/my", protect, getMyConsultingRequests);
router.get("/", protect, getConsultingRequests); // ← برگرداندنش!
router.patch("/:id/status", protect, updateConsultingStatus);

export default router;
