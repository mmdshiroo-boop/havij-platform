import { Router } from "express";
import { protect, hasPermission } from "../middleware/auth.middleware";
import {
  getFinancialSummary,
  getTransactions,
} from "../controllers/financial.controller";

const router = Router();

router.use(protect, hasPermission("financial:read"));

router.get("/summary", getFinancialSummary);
router.get("/transactions", getTransactions);

export default router;
