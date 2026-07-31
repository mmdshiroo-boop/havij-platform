// backend/src/routes/reaction.routes.ts
import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  toggleReaction,
  getReactions,
} from "../controllers/reaction.controller";

const router = Router();

// تمام مسیرها نیاز به ورود دارند (عملیات شخصی کاربر)
router.use(protect);

router.post("/messages/:messageId/reactions", toggleReaction);
router.get("/messages/:messageId/reactions", getReactions);

export default router;
