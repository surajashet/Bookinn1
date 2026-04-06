import express from "express";
import {
  generateInvoice,
  getInvoice,
  getInvoiceByBookingId,
  getUserInvoices,
  getAllInvoices,
  updateInvoiceStatus,
  downloadInvoice
} from "../controllers/invoice.controller.js";
import { authenticateToken, authorizeAdmin, authorizeStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

// ── IMPORTANT: specific routes MUST come before /:invoice_id ──
// If you put /:invoice_id first, it swallows /booking/:id, /my-invoices etc.

router.get("/my-invoices", getUserInvoices);
router.get("/booking/:booking_id", getInvoiceByBookingId);   // ← NEW: used by BookingInvoice.jsx
router.get("/:invoice_id/download", downloadInvoice);
router.get("/:invoice_id", getInvoice);

router.post("/generate/:booking_id", authorizeStaff, generateInvoice);
router.get("/", authorizeAdmin, getAllInvoices);
router.patch("/:invoice_id/status", authorizeAdmin, updateInvoiceStatus);

export default router;