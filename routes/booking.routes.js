import express from "express";
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  checkRoomAvailability
} from "../controllers/booking.controller.js";
import { authenticateToken, authorizeAdmin, authorizeStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/availability/:room_id", checkRoomAvailability);

// Protected user routes
router.post("/", authenticateToken, createBooking);
router.get("/user/:user_id", authenticateToken, getUserBookings);
router.post("/:id/cancel", authenticateToken, cancelBooking);

// Staff/Admin routes
router.get("/", authenticateToken, authorizeStaff, getAllBookings);
router.patch("/:id/status", authenticateToken, authorizeStaff, updateBookingStatus);

export default router;