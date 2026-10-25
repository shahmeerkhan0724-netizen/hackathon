import express from "express";
import {
  generatePayroll,
  getPayrollRecords,
  getPayroll,
  approvePayroll,
  markPayrollPaid,
} from "../controllers/payrollController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/generate", protect, allowRoles("Admin", "HR"), generatePayroll);
router.get("/", protect, getPayrollRecords);
router.get("/:id", protect, getPayroll);
router.patch("/:id/approve", protect, allowRoles("Admin"), approvePayroll);
router.patch("/:id/pay", protect, allowRoles("Admin"), markPayrollPaid);

export default router;