import express from "express";
import {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, allowRoles("Admin"), createCompany);
router.get("/", protect, getCompanies);
router.get("/:id", protect, getCompany);
router.put("/:id", protect, allowRoles("Admin"), updateCompany);
router.delete("/:id", protect, allowRoles("Admin"), deleteCompany);

export default router;
