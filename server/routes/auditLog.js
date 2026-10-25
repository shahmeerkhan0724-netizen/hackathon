import express from "express";
import {
  getAuditLogs,
  getAuditLog,
} from "../controllers/auditLogController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, allowRoles("Admin", "HR"), getAuditLogs);
router.get("/:id", protect, allowRoles("Admin", "HR"), getAuditLog);

export default router;