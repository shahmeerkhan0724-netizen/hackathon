import express from "express";
import {
  createLeaveBalance,
  getLeaveBalances,
  getLeaveBalanceByEmployee,
  updateLeaveBalance,
} from "../controllers/leaveBalanceController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, allowRoles("Admin", "HR"), createLeaveBalance);
router.get("/", protect, getLeaveBalances);
router.get("/:employeeId", protect, getLeaveBalanceByEmployee);
router.put("/:employeeId", protect, allowRoles("Admin", "HR"), updateLeaveBalance);

export default router;
