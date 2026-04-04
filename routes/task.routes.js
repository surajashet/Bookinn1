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

// ============ CUSTOMER ROUTES ============
router.post("/service-request", createServiceRequest);
router.get("/my-requests", getUserServiceRequests);

// ============ STAFF ROUTES ============
router.get("/staff/tasks", authorizeStaff, getStaffAssignedTasks);
router.get("/staff/:staff_id", authorizeStaff, getTasksByStaff);
router.patch("/:task_id/status", authorizeStaff, updateTaskStatus);  // Staff can update task status

// ============ ADMIN ROUTES ============
router.get("/", authorizeAdmin, getAllTasksWithFilters);
router.get("/stats", authorizeAdmin, getTaskStats);
router.post("/", authorizeAdmin, createTask);
router.get("/room/:room_id", authorizeAdmin, getTasksByRoom);
router.put("/:task_id/reassign", authorizeAdmin, reassignTask);

export default router;