// backend/src/routes/subscription.routes.ts
import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();
router.use(protect);
router.get("/plans", SubscriptionController.getPlans);
router.post("/purchase", SubscriptionController.initiatePurchase);
router.post("/verify", SubscriptionController.verifyPayment);
router.get("/status", SubscriptionController.checkStatus);
router.get("/current-plan", SubscriptionController.getCurrentSubscription);
export default router;
