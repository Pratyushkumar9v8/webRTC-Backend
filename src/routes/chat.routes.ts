import { Router } from "express";
import { getMeetingChats } from "../controllers/chat.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.route("/:meetingId").get(isAuthenticated, getMeetingChats);

export default router;
