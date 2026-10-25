import express from "express";
import {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, allowRoles("Admin", "HR"), createDepartment);
router.get("/", protect, getDepartments);
router.get("/:id", protect, getDepartment);
router.put("/:id", protect, allowRoles("Admin", "HR"), updateDepartment);
router.delete("/:id", protect, allowRoles("Admin", "HR"), deleteDepartment);

export default router;
