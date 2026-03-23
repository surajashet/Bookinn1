import express from "express";
import { getClientDashboard, getClientRooms } from "../controllers/client.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, getClientDashboard);
router.get("/rooms", authenticateToken, getClientRooms);

export default router;