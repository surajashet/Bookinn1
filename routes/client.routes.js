import express from "express";
import { 
  getClientDashboard, 
  getClientRooms,
  getRoomDetailsWithAvailability 
} from "../controllers/client.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, getClientDashboard);
router.get("/rooms", authenticateToken, getClientRooms);
router.get("/rooms/:room_id/availability", authenticateToken, getRoomDetailsWithAvailability);

export default router;