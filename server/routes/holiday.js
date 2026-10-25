import express from "express";
import {
  createHoliday,
  getHolidays,
  getHoliday,
  updateHoliday,
  deleteHoliday,
} from "../controllers/holidayController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, allowRoles("Admin", "HR"), createHoliday);
router.get("/", protect, getHolidays);
router.get("/:id", protect, getHoliday);
router.put("/:id", protect, allowRoles("Admin", "HR"), updateHoliday);
router.delete("/:id", protect, allowRoles("Admin", "HR"), deleteHoliday);

export default router;