import express from "express";
import {
  generateInvoice,
  getInvoice,
  getUserInvoices,
  getAllInvoices,
  updateInvoiceStatus,
  downloadInvoice
} from "../controllers/invoice.controller.js";
import { authenticateToken, authorizeAdmin, authorizeStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/my-invoices", getUserInvoices);
router.get("/:invoice_id", getInvoice);
router.get("/:invoice_id/download", downloadInvoice);
router.post("/generate/:booking_id", authorizeStaff, generateInvoice);
router.get("/", authorizeAdmin, getAllInvoices);
router.patch("/:invoice_id/status", authorizeAdmin, updateInvoiceStatus);

export default router;
