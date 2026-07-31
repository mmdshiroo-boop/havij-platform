// backend/src/routes/favorite.routes.ts
import { Router } from "express";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
} from "../controllers/favorite.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// تمام مسیرها نیاز به ورود دارند (عملیات شخصی کاربر)
router.use(protect);

router.post("/", addFavorite);
router.delete("/:adId", removeFavorite);
router.get("/", getFavorites);
router.get("/check/:adId", checkFavorite);

export default router;