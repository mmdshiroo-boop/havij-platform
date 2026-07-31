// backend/src/routes/location.routes.ts
import { Router } from "express";
import {
  getProvinces,
  getCitiesByProvince,
  getProvinceBySlug,
  getLocationFromIP,
  reverseGeocodeNominatim,
  updateMyLocation,
  setUserOffline,
  updateLocationFromSearch, // 👈 اضافه شد
} from "../controllers/location.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// ─── مسیرهای عمومی (بدون نیاز به لاگین) ───
router.get("/provinces", getProvinces);
router.get("/provinces/:slug", getProvinceBySlug);
router.get("/cities/:provinceId", getCitiesByProvince);
router.get("/from-ip", getLocationFromIP);
router.get("/reverse-geocode", reverseGeocodeNominatim);

// 👈 روت ثبت موقعیت از باکس جستجو (برای کاربر لاگین‌شده یا میهمان)
router.post("/save-from-search", updateLocationFromSearch);

// ─── مسیرهای کاربری (نیاز به لاگین) ───
router.put("/me", protect, updateMyLocation);
router.post("/me/offline", protect, setUserOffline);

export default router;