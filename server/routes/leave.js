import express from "express";
import {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  approveLeave,
  rejectLeave,
  cancelLeave,
} from "../controllers/leaveController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createLeaveRequest);
router.get("/", protect, getLeaveRequests);
router.get("/:id", protect, getLeaveRequest);

router.patch("/:id/approve", protect, allowRoles("Admin", "HR"), approveLeave);
router.patch("/:id/reject", protect, allowRoles("Admin", "HR"), rejectLeave);
router.patch("/:id/cancel", protect, cancelLeave);

export default router;