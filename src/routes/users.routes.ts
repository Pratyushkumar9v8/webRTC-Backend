import { Router } from "express";
import { addToHistory, getUserHistory, login, register} from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router= Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(isAuthenticated,addToHistory)
router.route("/get_all_activity").get(isAuthenticated,getUserHistory)

export default router;