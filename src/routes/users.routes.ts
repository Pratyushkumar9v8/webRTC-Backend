import { Router } from "express";
import { addToHistory, getUserHistory, googleAuth, logout, devLogin } from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router= Router();

router.route("/google").post(googleAuth)
router.route("/dev-login").post(devLogin)
router.route("/logout").post(logout)
router.route("/add_to_activity").post(isAuthenticated,addToHistory)
router.route("/get_all_activity").get(isAuthenticated,getUserHistory)

export default router;
