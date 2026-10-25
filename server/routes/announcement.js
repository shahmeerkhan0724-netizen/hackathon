import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, allowRoles("Admin", "HR"), createAnnouncement);
router.get("/", protect, getAnnouncements);
router.get("/:id", protect, getAnnouncement);
router.put("/:id", protect, allowRoles("Admin", "HR"), updateAnnouncement);
router.delete("/:id", protect, allowRoles("Admin", "HR"), deleteAnnouncement);

export default router;
