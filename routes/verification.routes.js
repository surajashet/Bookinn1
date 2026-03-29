import express from "express";
import { sendVerificationOTP, verifyOTP } from "../controllers/verification.controller.js";

const router = express.Router();

router.post("/send-otp", sendVerificationOTP);
router.post("/verify", verifyOTP);

export default router;