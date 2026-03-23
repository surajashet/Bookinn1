import express from "express";
import { uploadRoomImage } from "../controllers/upload.controller.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/room-image", authenticateToken, authorizeAdmin, uploadRoomImage);

export default router;