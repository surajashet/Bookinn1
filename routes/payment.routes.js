import express from "express";
import {
  processPayment,
  getPayment,
  getInvoicePayments,
  getAllPayments,
  refundPayment,
  getPaymentStats,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/payment.controller.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

// ── Existing routes ────────────────────────────────────────────────────────
router.post("/process/:invoice_id",         processPayment);
router.get("/invoice/:invoice_id",          getInvoicePayments);
router.get("/stats/all",  authorizeAdmin,   getPaymentStats);
router.get("/",           authorizeAdmin,   getAllPayments);
router.post("/:payment_id/refund", authorizeAdmin, refundPayment);
router.get("/:payment_id",                  getPayment);

// ── Razorpay routes ────────────────────────────────────────────────────────
router.post("/razorpay/create-order",       createRazorpayOrder);
router.post("/razorpay/verify",             verifyRazorpayPayment);

export default router;