// backend/src/routes/session.routes.ts
import { Router } from "express";
import {
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
} from "../controllers/session.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// تمام مسیرها نیاز به ورود دارند (اطلاعات نشست شخصی کاربر)
router.use(protect);

router.get("/", getSessions);
router.delete("/:id", revokeSession);
router.delete("/", revokeAllOtherSessions);

export default router;
