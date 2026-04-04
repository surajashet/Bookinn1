import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  // updateRoomStatus,  // REMOVED - no longer needed
  deleteRoom,
  checkRoomAvailability,
  getRoomStats,
  // bulkUpdateRoomStatus,  // REMOVED - no longer needed
  getClientRooms,
  checkRoomBookings,
  forceDeleteRoom
  // fixStuckRoomStatuses  // REMOVED - no longer needed since no room_status
} from "../controllers/room.controller.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/", getRooms);
router.get("/stats", getRoomStats);
router.get("/availability/:room_id", checkRoomAvailability);
router.get("/:id", getRoomById);
router.get("/client", getClientRooms);

// REMOVED: room status update route - no longer needed

// Admin only routes
router.post("/", authenticateToken, authorizeAdmin, createRoom);
router.put("/:room_id", authenticateToken, authorizeAdmin, updateRoom);
router.delete("/:room_id", authenticateToken, authorizeAdmin, deleteRoom);
router.delete("/:room_id/force", authenticateToken, authorizeAdmin, forceDeleteRoom);
router.get("/:room_id/check-bookings", authenticateToken, authorizeAdmin, checkRoomBookings);

// REMOVED: bulk/status and fix-stuck-statuses routes

export default router;