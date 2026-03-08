import express from "express";
import {
  createRoom,
  getRooms,
  updateRoomStatus
} from "../controllers/room.controller.js";

const router = express.Router();

router.post("/", createRoom);
router.get("/", getRooms);
router.patch("/:room_id/status", updateRoomStatus);

export default router;
