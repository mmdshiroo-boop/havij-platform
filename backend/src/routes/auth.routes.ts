import { Router } from "express";
import {
  requestVerificationCode,
  verifyCodeAndAuth,
  resendVerificationCode,
  getMe,
  login,
  changePassword,
  logout,
  resetPassword, 
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// مسیرهای عمومی
router.post("/send-code", requestVerificationCode);
router.post("/verify-code", verifyCodeAndAuth);
router.post("/resend-code", resendVerificationCode);
router.post("/login", login);
router.post("/reset-password", resetPassword); 

// مسیرهای محافظت‌شده
router.post("/verify-national-code", protect, verifyCodeAndAuth);
router.post("/profile/change-password", protect, changePassword);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

export default router;