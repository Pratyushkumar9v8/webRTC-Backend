import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.route("/stats").get(isAuthenticated, getDashboardStats);

export default router;
