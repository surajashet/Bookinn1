import express from "express";
import {
  createBooking,
  getBookings,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingsByDateRange,
  getBookingStats
} from "../controllers/booking.controller.js";
import { authenticateToken, authorizeAdmin, authorizeStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", createBooking);
router.get("/my-bookings", authenticateToken, getUserBookings);
router.post("/:booking_id/cancel", authenticateToken, cancelBooking);
router.get("/", authenticateToken, authorizeStaff, getBookings);
router.get("/stats", authenticateToken, authorizeAdmin, getBookingStats);
router.get("/range", authenticateToken, authorizeStaff, getBookingsByDateRange);
router.get("/:booking_id", authenticateToken, authorizeStaff, getBookingById);
router.patch("/:booking_id/status", authenticateToken, authorizeStaff, updateBookingStatus);

export default router;
