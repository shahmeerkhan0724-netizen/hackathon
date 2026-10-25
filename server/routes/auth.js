import express from "express";

import {
  setupAdmin,
  login,
  getMe,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

// Create the first admin account
router.post("/setup-admin", setupAdmin);

// Login
router.post("/login", login);

// Get logged-in user's profile
router.get("/me", protect, getMe);

export default router;