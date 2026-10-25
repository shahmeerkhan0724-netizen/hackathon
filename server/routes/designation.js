import express from "express";
import {
  createDesignation,
  getDesignations,
  getDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designationController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, allowRoles("Admin", "HR"), createDesignation);
router.get("/", protect, getDesignations);
router.get("/:id", protect, getDesignation);
router.put("/:id", protect, allowRoles("Admin", "HR"), updateDesignation);
router.delete("/:id", protect, allowRoles("Admin", "HR"), deleteDesignation);

export default router;
