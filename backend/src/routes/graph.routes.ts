import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getNetworkGraph } from "../controllers/graph.controller";

const router = Router();
router.use(protect);

// فقط گراف شبکه
router.get("/network", getNetworkGraph);

export default router;
