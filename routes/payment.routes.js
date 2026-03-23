import express from "express";
import {
  processPayment,
  getPayment,
  getInvoicePayments,
  getAllPayments,
  refundPayment,
  getPaymentStats
} from "../controllers/payment.controller.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/process/:invoice_id", processPayment);
router.get("/:payment_id", getPayment);
router.get("/invoice/:invoice_id", getInvoicePayments);
router.get("/", authorizeAdmin, getAllPayments);
router.get("/stats/all", authorizeAdmin, getPaymentStats);
router.post("/:payment_id/refund", authorizeAdmin, refundPayment);

export default router;
