import express from "express";
import {
  checkIn,
  checkOut,
  markAttendance,
  getAttendanceRecords,
  getAttendance,
  updateAttendance,
} from "../controllers/attendanceController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/check-in", protect, checkIn);
router.patch("/check-out", protect, checkOut);

router.post("/", protect, allowRoles("Admin", "HR"), markAttendance);
router.get("/", protect, getAttendanceRecords);
router.get("/:id", protect, getAttendance);
router.put("/:id", protect, allowRoles("Admin", "HR"), updateAttendance);

export default router;