import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  processPayment,
  getPayment,
  getInvoicePayments,
  getAllPayments,
  refundPayment,
  getPaymentStats,
} from "../controllers/payment.controller.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============ RAZORPAY ROUTES ============
router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);

// ============ MANUAL PAYMENT ROUTES (Fallback) ============
router.post("/process/:invoice_id", processPayment);

// ============ PAYMENT RETRIEVAL ROUTES ============
router.get("/:payment_id", getPayment);
router.get("/invoice/:invoice_id", getInvoicePayments);

// ============ ADMIN ONLY ROUTES ============
router.get("/", authorizeAdmin, getAllPayments);
router.get("/stats/all", authorizeAdmin, getPaymentStats);
router.post("/:payment_id/refund", authorizeAdmin, refundPayment);

export default router;