import express from "express";
import {
  createTask,
  getAllTasks,
  getTasksByStaff,
  getTasksByRoom,
  updateTaskStatus,
  getTaskStats,
  reassignTask,
  createServiceRequest,
  getUserServiceRequests,
  getStaffAssignedTasks,
  getAllTasksWithFilters
} from "../controllers/task.controller.js";
import { authenticateToken, authorizeAdmin, authorizeStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

// All task routes require authentication
router.use(authenticateToken);

// Customer service requests
router.post("/service-request", createServiceRequest);
router.get("/my-requests", getUserServiceRequests);

// Staff routes
router.get("/staff/tasks", authorizeStaff, getStaffAssignedTasks);
router.get("/staff/:staff_id", getTasksByStaff);

// Admin routes
router.get("/", authorizeAdmin, getAllTasksWithFilters);
router.get("/stats", authorizeAdmin, getTaskStats);
router.post("/", authorizeAdmin, createTask);
router.get("/room/:room_id", authorizeAdmin, getTasksByRoom);
router.patch("/:task_id/status", authorizeAdmin, updateTaskStatus);
router.patch("/:task_id/reassign", authorizeAdmin, reassignTask);

export default router;