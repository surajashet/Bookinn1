import express from "express";
import {
  createTask,
  getAllTasks,
  getTasksByStaff,
  getTasksByRoom,
  updateTaskStatus,
  getTaskStats,
  reassignTask
} from "../controllers/task.controller.js";
import { authenticateToken, authorizeAdmin, authorizeStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/", createTask);
router.get("/", authorizeAdmin, getAllTasks);
router.get("/stats", authorizeAdmin, getTaskStats);
router.get("/staff/:staff_id", getTasksByStaff);
router.get("/room/:room_id", getTasksByRoom);
router.patch("/:task_id/status", updateTaskStatus);
router.patch("/:task_id/reassign", authorizeAdmin, reassignTask);

export default router;
