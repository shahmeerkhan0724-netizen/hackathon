import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, allowRoles("Admin", "HR"), createEmployee);
router.get("/", protect, getEmployees);
router.get("/:id", protect, getEmployee);
router.put("/:id", protect, allowRoles("Admin", "HR"), updateEmployee);
router.delete("/:id", protect, allowRoles("Admin", "HR"), deleteEmployee);

export default router;
