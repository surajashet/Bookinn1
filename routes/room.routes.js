import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
  checkRoomAvailability,
  getRoomStats,
  bulkUpdateRoomStatus,
  getClientRooms,
  checkRoomBookings,
  forceDeleteRoom
} from "../controllers/room.controller.js";
import { authenticateToken, authorizeAdmin, authorizeStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/", getRooms);
router.get("/stats", getRoomStats);
router.get("/availability/:room_id", checkRoomAvailability);
router.get("/:id", getRoomById);
router.get("/client", getClientRooms);

// Staff can update room status (cleaning, maintenance etc)
router.patch("/:room_id/status", authenticateToken, authorizeStaff, updateRoomStatus);

// Admin only routes
router.post("/", authenticateToken, authorizeAdmin, createRoom);
router.put("/:room_id", authenticateToken, authorizeAdmin, updateRoom);
router.delete("/:room_id", authenticateToken, authorizeAdmin, deleteRoom);
router.delete("/:room_id/force", authenticateToken, authorizeAdmin, forceDeleteRoom);
router.get("/:room_id/check-bookings", authenticateToken, authorizeAdmin, checkRoomBookings);
router.post("/bulk/status", authenticateToken, authorizeAdmin, bulkUpdateRoomStatus);

export default router;