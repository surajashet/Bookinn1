import express from "express";
import { createTask, getTasksByStaff } from "../controllers/task.controller.js";

const router = express.Router();

router.post("/", createTask);
router.get("/staff/:staff_id", getTasksByStaff);

export default router;